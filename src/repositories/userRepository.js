import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

export const getUserByEmail = async (emailid) => {
    return await prisma.users.findFirst({
        where: {
            emailid: emailid,
            isdeleted: false
        }
    });
}

export const addUser = async (userData, createdby, uoid) => {
    try {
        // Use transaction to ensure data consistency
        return await prisma.$transaction(async (tx) => {
            // Create the user
            const user = await tx.users.create({
                data: {
                    fullname: userData.fullname,
                    firstname: userData.firstname || null,
                    lastname: userData.lastname || null,
                    emailid: userData.emailid || null,
                    mobno: userData.mobno || null,
                    employee_id: userData.employeeid || null,
                    canlogin: userData.canlogin ?? true,
                    password: userData.password || null,
                    usercode: userData.usercode || null,
                    image: userData.image || null,
                    // Set these to null if not provided or convert to BigInt if provided
                    profilestatus: userData.profilestatus ? BigInt(userData.profilestatus) : null,
                    accountstatus: userData.accountstatus ? BigInt(userData.accountstatus) : null,
                    isapproved: userData.isapproved ?? false,
                    isdeleted: false,
                    createdby: createdby ? BigInt(createdby) : null,
                    createddate: new Date(),
                    marketsegement: userData.marketsegement ? BigInt(userData.marketsegement) : null,
                    languageid: userData.languageid ? BigInt(userData.languageid) : null,
                    currencyid: userData.currencyid ? BigInt(userData.currencyid) : null,
                    isadmin: userData.isadmin ?? false
                }
            });

            // Create role mappings if provided
            if (userData.roleModels && userData.roleModels.length > 0) {
                await tx.userrolemapping.createMany({
                    data: userData.roleModels.map(role => ({
                        uid: user.uid,
                        uoid: role.uoid ? BigInt(role.uoid) : uoid ? BigInt(uoid) : null,
                        roleid: role.roleid ? BigInt(role.roleid) : null,
                        roletypeid: role.roletypeid ? BigInt(role.roletypeid) : null,
                        isdeleted: false,
                        createdby: createdby ? BigInt(createdby) : null,
                        createddate: new Date()
                    }))
                });
            }

            // Create rights mappings if provided
            if (userData.rightsOfUserModel?.modules) {
                const rightsToCreate = userData.rightsOfUserModel.modules
                    .flatMap(module =>
                        module.rightsList
                            .filter(right => right.selected)
                            .map(right => ({
                                userid: user.uid,
                                rightid: BigInt(right.rightId),
                                Isdeleted: false,
                                // createddate: new Date()
                            }))
                    );

                if (rightsToCreate.length > 0) {
                    await tx.userrightsmapping.createMany({
                        data: rightsToCreate
                    });
                }
            }

            // Remove sensitive data before returning
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    } catch (error) {
        logger.error('Error creating user', {
            error: error.message,
            stack: error.stack
        })
        throw error;
    }
}

export const getUserById = async (id) => {
    const user = await prisma.users.findUnique({
        where: { uid: id },
        include: {
            userrolemapping_userrolemapping_uidTousers: true
        }
    })
    const roleModels = user.userrolemapping_userrolemapping_uidTousers
    delete user.userrolemapping_userrolemapping_uidTousers;
    return { ...user, roleModels };
}

export const editUser = async (userId, updateData, roleModels, rightsModules, tx) => {
    // Update user basic information
    const updatedUser = await tx.users.update({
        where: {
            uid: BigInt(userId)
        },
        data: updateData
    });

    // Handle role mappings if provided
    if (roleModels && Array.isArray(roleModels)) {
        // Delete existing role mappings
        await tx.userrolemapping.deleteMany({
            where: {
                uid: BigInt(userId)
            }
        });

        // Create new role mappings if any
        if (roleModels.length > 0) {
            await tx.userrolemapping.createMany({
                data: roleModels
            });
        }
    }

    // Handle rights mappings if provided
    if (rightsModules) {
        // Delete existing rights mappings
        await tx.userrightsmapping.deleteMany({
            where: {
                userid: BigInt(userId)
            }
        });

        const rightsToCreate = rightsModules
            .flatMap(module =>
                module.rightsList
                    .filter(right => right.selected)
                    .map(right => ({
                        userid: BigInt(userId),
                        rightid: BigInt(right.rightId || 0),
                        Modifiedby: updateData.modifiedby,
                        Isdeleted: false
                    }))
            );

        if (rightsToCreate.length > 0) {
            await tx.userrightsmapping.createMany({
                data: rightsToCreate
            });
        }
    }

    // Get updated user data with mappings
    const updatedUserData = await tx.users.findUnique({
        where: {
            uid: BigInt(userId)
        }
    });

    const roleMappings = await tx.userrolemapping.findMany({
        where: {
            uid: BigInt(userId),
            isdeleted: false
        }
    });

    const rightsMappings = await tx.userrightsmapping.findMany({
        where: {
            userid: BigInt(userId),
            Isdeleted: false
        }
    });

    return {
        ...updatedUserData,
        role_mappings: roleMappings,
        rights_mappings: rightsMappings
    };
};

export const getAllUsers = async (uoid) => {
    return await prisma.userlogin.findMany({
        where: {
            uoid: BigInt(uoid),
            isdeleted: false
        }
    })
}

export const deleteUser = async (userId, deletedby) => {
    return await prisma.users.update({
        where: { uid: BigInt(userId) },
        data: {
            isdeleted: true,
            deletedby: BigInt(deletedby),
            deleteddate: new Date()
        }
    })
}

export const updateProfileStatus = async (userId, profileStatus) => {
    return await prisma.users.update({
        where: { uid: BigInt(userId) },
        data: {
            profilestatus: BigInt(profileStatus)
        }
    })
}

export const updateAccountStatus = async (userId, accountStatus) => {
    return await prisma.users.update({
        where: { uid: BigInt(userId) },
        data: {
            accountstatus: BigInt(accountStatus)
        }
    })
}

export const searchCustomerByMobile = async (mobileNumber) => {
    return await prisma.users.findMany({
        where: {
            mobno: {
                startsWith: mobileNumber, // Similar to 'LIKE $1' in SQL
            },
            isdeleted: false, // Ensuring the user is not deleted
            userrolemapping_userrolemapping_uidTousers: {
                some: {
                    roleid: 7, // Filtering by roleid
                    isdeleted: false, // Ensuring the user role mapping is not deleted
                },
            },
        },
        select: {
            uid: true,
            fullname: true,
            mobno: true,
        },
        take: 10, // Limiting the number of results
    });
}

export const getCustomers = async (filters, pagination) => {
    const { name, phoneNumber } = filters;
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {
        isdeleted: false,
        userrolemapping_userrolemapping_uidTousers: {
            some: {
                roleid: 7,
                isdeleted: false,
            },
        },
    };

    // Add name filter if provided
    if (name) {
        whereConditions.fullname = {
            contains: name,
            mode: 'insensitive'
        };
    }

    // Add phone number filter if provided
    if (phoneNumber) {
        whereConditions.mobno = {
            contains: phoneNumber,
            mode: 'insensitive'
        };
    }

    // Get total count for pagination
    const totalCustomers = await prisma.users.count({
        where: whereConditions
    });

    // Get customers with pagination
    const customers = await prisma.users.findMany({
        where: whereConditions,
        orderBy: {
            createddate: 'desc',
        },
        include: {
            userrolemapping_userrolemapping_uidTousers: {
                where: {
                    isdeleted: false,
                },
            },
        },
        skip,
        take: limit,
    });

    return {
        data: customers,
        pagination: {
            total: totalCustomers,
            page,
            limit,
            pages: Math.ceil(totalCustomers / limit)
        }
    };
}

export const findWaiterById = async (waiterId, tx = prisma) => {
    // Get waiter's basic information with role
    const waiter = await tx.users.findFirst({
        where: {
            uid: BigInt(waiterId),
            isdeleted: false,
            userrolemapping_userrolemapping_uidTousers: {
                some: {
                    roleid: BigInt(3), // Waiter role ID
                    isdeleted: false
                }
            }
        },
        select: {
            uid: true,
            fullname: true,
            firstname: true,
            lastname: true,
            emailid: true,
            mobno: true,
            profilestatus: true,
            accountstatus: true,
            employee_id: true,
            userrolemapping_userrolemapping_uidTousers: {
                select: {
                    roleid: true
                },
                take: 1
            }
        }
    });

    if (!waiter) {
        return null;
    }

    // Get all bookings for the waiter with table information using the correct relation name
    const bookings = await tx.table_bookings.findMany({
        where: {
            waiter_id: parseInt(waiterId),
            is_deleted: false
        },
        select: {
            booking_id: true,
            uid: true,
            booking_time: true,
            table_id: true,
            no_of_guests: true,
            waiter_id: true,
            merge_table_id: true,
            createddate: true,
            is_reservation: true,
            // Use the correct relation name from your Prisma schema
            table_information_table_bookings_table_idTotable_information: {
                select: {
                    table_name: true,
                    capacity: true,
                    status: true
                }
            }
        }
    });

    // Transform the bookings to use a simpler table_information property
    const transformedBookings = bookings.map(booking => ({
        ...booking,
        table_information: booking.table_information_table_bookings_table_idTotable_information,
        // Remove the verbose relation property
        table_information_table_bookings_table_idTotable_information: undefined
    }));

    // Get customer information for all bookings
    const customerInfos = await tx.users.findMany({
        where: {
            uid: {
                in: bookings.map(booking => booking.uid).filter(Boolean)
            }
        },
        select: {
            uid: true,
            fullname: true,
            mobno: true
        }
    });

    // Get merged table information
    const mergedTableIds = bookings
        .filter(booking => booking.merge_table_id && booking.merge_table_id.length > 0)
        .flatMap(booking => booking.merge_table_id);

    const mergedTables = mergedTableIds.length > 0 ? await tx.table_information.findMany({
        where: {
            table_id: {
                in: mergedTableIds
            }
        },
        select: {
            table_id: true,
            table_name: true,
            capacity: true
        }
    }) : [];

    return {
        waiter,
        bookings: transformedBookings,
        customerInfos,
        mergedTables
    };
};

export const getCustomerDetails = async (customerId, page = 1, limit = 10) => {
    try {
        // Get customer basic info
        const customer = await prisma.users.findFirst({
            where: {
                uid: BigInt(customerId),
                isdeleted: false
            },
            select: {
                uid: true,
                fullname: true,
                emailid: true,
                mobno: true,
                createddate: true
            }
        });

        if (!customer) return null;

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get customer orders with pagination
        const orders = await prisma.orders.findMany({
            where: {
                buyerid: BigInt(customerId),
                isdeleted: false
            },
            select: {
                orderid: true,
                orderno: true,
                orderdate: true,
                orderstatus: true,
                orderitemtotal: true,
                ordertaxtotal: true,
                orderdiscount: true,
                ordertotal: true,
                paymentstatus: true,
                shippingstatus: true,
                table_id: true,
                serving_type: true
            },
            skip,
            take: limit,
            orderBy: {
                orderdate: 'desc'
            }
        });

        // Get total orders count
        const totalOrders = await prisma.orders.count({
            where: {
                buyerid: BigInt(customerId),
                isdeleted: false
            }
        });

        // Calculate total spent
        const totalSpent = await prisma.orders.aggregate({
            where: {
                buyerid: BigInt(customerId),
                isdeleted: false
            },
            _sum: {
                ordertotal: true
            }
        });

        return {
            customer: {
                uid: String(customer.uid),
                fullname: customer.fullname,
                emailid: customer.emailid,
                mobno: customer.mobno,
                joined_date: customer.createddate
            },
            orders: orders.map(order => ({
                orderid: String(order.orderid),
                orderno: order.orderno || 0,
                orderdate: order.orderdate,
                orderstatus: order.orderstatus ? String(order.orderstatus) : null,
                orderitemtotal: String(order.orderitemtotal || "0"),
                ordertaxtotal: String(order.ordertaxtotal || "0"),
                orderdiscount: String(order.orderdiscount || "0"),
                ordertotal: String(order.ordertotal || "0"),
                paymentstatus: order.paymentstatus,
                shippingstatus: order.shippingstatus,
                table_id: String(order.table_id || "0"),
                serving_type: order.serving_type ? String(order.serving_type) : null
            })),
            total_orders: totalOrders,
            total_spent: Number(totalSpent._sum.ordertotal) || 0,
            pagination: {
                page,
                limit,
                total: totalOrders,
                pages: Math.ceil(totalOrders / limit)
            }
        };
    } catch (error) {
        logger.error('Error in getCustomerDetails repository:', {
            error: error.message,
            stack: error.stack,
            customerId
        });
        throw error;
    }
};

export const searchUsers = async (whereConditions, skip, itemsPerPage) => {
    try {
        // Get total count
        const totalUsers = await prisma.userlogin.count({
            where: whereConditions,
        });

        // Get users with pagination
        const users = await prisma.userlogin.findMany({
            where: whereConditions,
            orderBy: { uid: 'asc' },
            skip: skip,
            take: itemsPerPage,
        });

        return { users, totalUsers };
    } catch (error) {
        logger.error('Error in searchUsers repository:', {
            error: error.message,
            stack: error.stack,
            whereConditions
        });
        throw error;
    }
};