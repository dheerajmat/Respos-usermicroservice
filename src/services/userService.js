import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import * as userRepository from '../repositories/userRepository.js';

const addUser = async (userData, createdby, uoid) => {
    try {
        // Check if user exists
        if (userData.emailid) {
            const existingUser = await userRepository.getUserByEmail(userData.emailid);

            if (existingUser) {
                throw new AppError('User with this email already exists', 400);
            }
        }

        // Hash password if provided
        userData.password = userData.password ? await bcrypt.hash(userData.password, 10) : null;

        // Use transaction to ensure data consistency
        return await userRepository.addUser(userData, createdby, uoid);

    } catch (error) {
        logger.error('Error adding user', {
            error: error.message,
            stack: error.stack,
            userData
        });
        throw error;
    }
};

const getUserById = async (id) => {
    try {
        return await userRepository.getUserById(id);
    } catch (error) {
        logger.error('Error getting user by id', {
            error: error.message,
            stack: error.stack,
            id
        })
        throw error;
    }
}

const editUser = async (userId, userData, modifiedby, uoid) => {
    try {
        logger.info('Starting user update transaction', {
            userId,
            updateData: JSON.stringify(userData)
        });

        return await prisma.$transaction(async (tx) => {
            // Prepare update data
            const updateData = {
                fullname: userData.fullname,
                firstname: userData.firstname,
                lastname: userData.lastname,
                emailid: userData.emailid,
                mobno: userData.mobno,
                canlogin: userData.canlogin,
                usercode: userData.usercode,
                image: userData.image,
                profilestatus: userData.profilestatus ? BigInt(userData.profilestatus) : null,
                isapproved: userData.isapproved,
                accountstatus: userData.accountstatus ? BigInt(userData.accountstatus) : null,
                isadmin: userData.isadmin,
                employee_id: userData.employee_id || userData.employeeid,
                modifiedby: BigInt(modifiedby),
                modifieddate: new Date()
            };

            // Add hashed password to update if it's a new plain text password
            if (userData.password && !userData.password.startsWith('$2b$')) {
                updateData.password = await bcrypt.hash(userData.password, 10);
            }

            // Prepare role models data if exists
            const roleModels = userData.roleModels?.map(role => ({
                uid: BigInt(userId),
                uoid: role.uoid ? BigInt(role.uoid) : uoid ? BigInt(uoid) : null,
                roleid: role.roleid ? BigInt(role.roleid) : null,
                roletypeid: role.roletypeid ? BigInt(role.roletypeid) : null,
                isdeleted: false,
                createdby: BigInt(modifiedby),
                createddate: new Date(),
                modifiedby: BigInt(modifiedby),
                modifieddate: new Date()
            }));

            // Update user and handle mappings in repository
            return await userRepository.editUser(
                userId,
                updateData,
                roleModels,
                userData.rightsOfUserModel?.modules,
                tx
            );

        });

    } catch (error) {
        logger.error('Error updating user', {
            error: error.message,
            stack: error.stack,
            userId,
            userData: JSON.stringify(userData)
        });

        if (error.code === 'P2002') {
            throw new AppError('Email already exists', 400);
        }

        throw error;
    }
};

const getAllUsers = async (uoid) => {
    try {
        return await userRepository.getAllUsers(uoid);
    } catch (error) {
        logger.error('Error fetching all users', {
            error: error.message,
            uoid
        });
        throw error;
    }
}

const userSearch = async (searchTerms, pagination) => {
    try {
        const { name, role, profilestatus, accountstatus, uoid, exclude } = searchTerms;
        const { itemsPerPage = 10, currentPage = 1 } = pagination;

        // Calculate offset for pagination
        const skip = (currentPage - 1) * itemsPerPage;

        // Build the base "where" clause using Prisma conditions
        const whereConditions = {
            isdeleted: false,
            roleid_orgid: BigInt(uoid),
        };

        // Add name condition (case-insensitive partial match)
        if (name && name.trim() !== '') {
            whereConditions.fullname = {
                contains: name,
                mode: 'insensitive',
            };
        }

        // Add profile status condition (5, 6, 7, 8)
        if (profilestatus && profilestatus.toString().trim() !== '') {
            const validProfileStatuses = [8, 9, 10, 11];
            const profileStatusNum = parseInt(profilestatus);
            
            if (validProfileStatuses.includes(profileStatusNum)) {
                whereConditions.profilestatus = BigInt(profileStatusNum);
            }
        }

        // Add account status condition (9, 10, 11, 12, 13, 14, 15)
        if (accountstatus && accountstatus.toString().trim() !== '') {
            const validAccountStatuses = [1, 2];
            const accStatusNum = parseInt(accountstatus);
            
            if (validAccountStatuses.includes(accStatusNum)) {
                whereConditions.accountstatus = BigInt(accStatusNum);
            }
        }

        // Handle role and exclude conditions
        if (role || exclude) {
            const roleConditions = [];
            
            if (role) {
                roleConditions.push({ roleid: BigInt(role) });
            }
            
            if (exclude) {
                roleConditions.push({ roleid: { not: BigInt(exclude) } });
            }

            // If we have both conditions, use AND to combine them
            if (roleConditions.length > 1) {
                whereConditions.AND = roleConditions;
            } else if (roleConditions.length === 1) {
                // If we only have one condition, apply it directly
                Object.assign(whereConditions, roleConditions[0]);
            }
        }

        // Log the where conditions for debugging
        logger.info('Search conditions:', whereConditions);

        // Use repository layer to fetch data
        const { users, totalUsers } = await userRepository.searchUsers(
            whereConditions,
            skip,
            itemsPerPage
        );

        // Transform BigInt values into numbers for JavaScript compatibility
        const transformedUsers = users.map((user) => ({
            ...user,
            uid: Number(user.uid),
            uoid: user.uoid ? Number(user.uoid) : null,
            createdby: user.createdby ? Number(user.createdby) : null,
            ulid: Number(user.ulid),
            roleid: user.roleid ? Number(user.roleid) : null,
            roleid_orgid: user.roleid_orgid ? Number(user.roleid_orgid) : null,
            profilestatus: user.profilestatus ? Number(user.profilestatus) : null,
            accountstatus: user.accountstatus ? Number(user.accountstatus) : null
        }));

        return {
            users: transformedUsers,
            pagination: {
                totalUsers,
                itemsPerPage,
                currentPage,
                totalPages: Math.ceil(totalUsers / itemsPerPage),
            }
        };
    } catch (error) {
        logger.error('Error searching users:', {
            error: error.message,
            stack: error.stack,
            searchTerms,
            pagination
        });
        throw error;
    }
};

const deleteUser = async (userId, deletedby) => {
    try {
        return await userRepository.deleteUser(userId, deletedby);
    } catch (error) {
        logger.error('Error deleting user', {
            error: error.message,
            stack: error.stack,
            userId
        })
        throw error;
    }
}

const updateProfileStatus = async (userId, profileStatus) => {
    try {
        return await userRepository.updateProfileStatus(userId, profileStatus);
    } catch (error) {
        logger.error('Error updating profile status', {
            error: error.message,
            stack: error.stack,
            userId
        })
        throw error;
    }
}

const updateAccountStatus = async (userId, accountStatus) => {
    try {
        return await userRepository.updateAccountStatus(userId, accountStatus);
    } catch (error) {
        logger.error('Error updating account status', {
            error: error.message,
            stack: error.stack,
            userId
        })
        throw error;
    }
}

const searchCustomerByMobile = async (mobileNumber) => {
    try {
        return await userRepository.searchCustomerByMobile(mobileNumber);
    } catch (error) {
        logger.error('Error in searchCustomerByMobile:', {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};

// const getCustomers = async () => {
//     try {
//         const customers = await prisma.users.findMany({
//             where: {
//                 isdeleted: false, // Ensure users are not deleted
//                 userrolemapping: {
//                     some: {
//                         roleid: 7, // Only include users with roleid = 7
//                         isdeleted: false, // Ensure role mapping is not deleted
//                     },
//                 },
//             },
//             orderBy: {
//                 createddate: 'desc', // Order by createddate in descending order
//             },
//             include: {
//                 userrolemapping: {
//                     where: {
//                         isdeleted: false, // Include role mappings that are not deleted
//                     },
//                 },
//             },
//         });

//         return customers;
//     } catch (error) {
//         logger.error('Database error', {
//             error: error.message,
//             service: 'respos-api',
//             target: 'users.findMany',
//         });
//         throw error;
//     }
// };

const getCustomers = async (filters, pagination) => {
    try {
        const customers = await userRepository.getCustomers(filters, pagination);

        // Format the response
        const formattedCustomers = customers.data.map((customer) => {
            const { userrolemapping_userrolemapping_uidTousers, ...rest } = customer;
            return {
                ...rest,
                roleModels: userrolemapping_userrolemapping_uidTousers,
            };
        });

        return {
            success: true,
            data: formattedCustomers,
            pagination: customers.pagination
        };
    } catch (error) {
        logger.error('Database error', {
            error: error.message,
            service: 'respos-api',
            target: 'users.findMany',
        });
        throw error;
    }
};

// ... existing code ...

const findWaiterById = async (waiterId) => {
    try {
        const result = await userRepository.findWaiterById(waiterId);
        
        if (!result || !result.waiter) {
            return null;
        }

        // Extract roleid and create cleaned waiter object
        const { userrolemapping_userrolemapping_uidTousers, ...waiterData } = result.waiter;
        const cleanedWaiter = {
            ...waiterData,
            roleid: userrolemapping_userrolemapping_uidTousers[0]?.roleid,
            uid: Number(waiterData.uid)
        };

        // Process and group bookings
        const groupedBookings = {
            upcoming: [],
            today: [],
            past: []
        };

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Create a map for quick customer lookup
        const customerMap = new Map(
            result.customerInfos.map(customer => [customer.uid, customer])
        );

        // Create a map for quick merged table lookup
        const mergedTableMap = new Map(
            result.mergedTables.map(table => [table.table_id, table])
        );

        for (const booking of result.bookings) {
            const customerInfo = booking.uid ? customerMap.get(booking.uid) : null;
            
            let mergedTables = [];
            if (booking.merge_table_id && booking.merge_table_id.length > 0) {
                mergedTables = booking.merge_table_id
                    .map(tableId => mergedTableMap.get(tableId))
                    .filter(Boolean);
            }

            // Determine booking status
            let bookingStatus;
            if (booking.booking_time > now) {
                bookingStatus = 'upcoming';
            } else if (booking.booking_time >= yesterday && booking.booking_time <= now) {
                bookingStatus = 'today';
            } else {
                bookingStatus = 'past';
            }

            const processedBooking = {
                ...booking,
                customer_name: customerInfo?.fullname,
                customer_contact: customerInfo?.mobno,
                table_name: booking.table_information?.table_name,
                table_capacity: booking.table_information?.capacity,
                table_status: booking.table_information?.status,
                merged_tables: mergedTables,
                booking_status: bookingStatus
            };

            groupedBookings[bookingStatus].push(processedBooking);
        }

        return {
            waiter: cleanedWaiter,
            total_bookings: result.bookings.length,
            grouped_bookings: groupedBookings,
            all_bookings: result.bookings
        };

    } catch (error) {
        logger.error('Error in findWaiterById:', {
            error: error.message,
            stack: error.stack,
            waiterId
        });
        throw error;
    }
};

const getCustomerDetails = async (customerId, page = 1, limit = 10) => {
    try {
        const customerDetails = await userRepository.getCustomerDetails(customerId, page, limit);

        if (!customerDetails) throw new AppError('Customer not found', 404);
        
        return {
            success: true,
            data: {
                customer: customerDetails.customer,
                orders: customerDetails.orders,
                total_orders: customerDetails.total_orders,
                total_spent: customerDetails.total_spent,
                pagination: customerDetails.pagination
            }
        };
    } catch (error) {
        logger.error('Error getting customer details:', {
            error: error.message,
            stack: error.stack,
            customerId
        });
        throw error;
    }
}

const saveOrganizationWithUser = async (data) => {
    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Create organization (initially without uid)
            const organization = await tx.userorganization.create({
                data: {
                    orgname: data.orgName,
                    orgemail: data.orgEmail,
                    orgmobile: data.orgMobile,
                    isdeleted: false,
                    createddate: new Date()
                }
            });

            // 2. Create user address (initially without uid)
            const address = await tx.useraddress.create({
                data: {
                    address1: data.orgAddress.address1,
                    address2: data.orgAddress.address2,
                    city: data.orgAddress.city,
                    state: BigInt(data.orgAddress.state),
                    country: data.orgAddress.country,
                    pincode: data.orgAddress.pincode,
                    latitude: data.orgAddress.latitude,
                    longitude: data.orgAddress.longitude,
                    isdeleted: false,
                    createddate: new Date()
                }
            });

            // 3. Create user
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const user = await tx.users.create({
                data: {
                    fullname: data.userFullName,
                    firstname: data.userFirstName,
                    lastname: data.userLastName,
                    emailid: data.orgEmail,
                    mobno: data.orgMobile,
                    password: hashedPassword,
                    canlogin: true,
                    isdeleted: false,
                    createddate: new Date()
                }
            });

            // 4. Update organization with user ID
            await tx.userorganization.update({
                where: { uoid: organization.uoid },
                data: {
                    uid: user.uid,
                    createdby: user.uid
                }
            });

            // 5. Update address with user ID
            await tx.useraddress.update({
                where: { uaid: address.uaid },
                data: {
                    uid: user.uid,
                    createdby: user.uid
                }
            });

            // 6. Create user organization address mapping
            await tx.userorgaddressmapping.create({
                data: {
                    uaid: address.uaid,
                    uoid: organization.uoid,
                    uid: user.uid,
                    isdefault: true,
                    isdeleted: false,
                    createddate: new Date(),
                    createdby: user.uid,
                    addrtype: 1 // You might want to make this configurable
                }
            });

            // 7. Create user role mapping
            await tx.userrolemapping.create({
                data: {
                    uid: user.uid,
                    uoid: organization.uoid,
                    roleid: BigInt(data.userRoleTypeId || 1),
                    roletypeid: null, // Default role type
                    isdeleted: false,
                    createddate: new Date(),
                    createdby: user.uid
                }
            });

            // Return created data
            return {
                success: true,
                data: {
                    organization: {
                        uoid: organization.uoid,
                        orgName: organization.orgname
                    },
                    user: {
                        uid: user.uid,
                        fullName: user.fullname
                    },
                    address: {
                        uaid: address.uaid
                    }
                }
            };
        });
    } catch (error) {
        logger.error('Error in saveOrganizationWithUser service:', {
            error: error.message,
            stack: error.stack
        });
        
        if (error.code === 'P2002') {
            throw new AppError('Email or mobile number already exists', 400);
        }
        
        throw error;
    }
};

const getOrganization = async (uoid) => {
    const organization = await prisma.userorganization.findUnique({
        where: { uoid },
        select: {
            uoid: true,
            orgname: true,
            orgemail: true,
            orgmobile: true,
            isdeleted: true,
            createddate: true,
            modifieddate: true
        }
    });

    if (!organization || organization.isdeleted) {
        throw new AppError('Organization not found', 404);
    }

    return {
        success: true,
        data: organization
    };
};

const getAddress = async (uaid) => {
    const address = await prisma.useraddress.findUnique({
        where: { uaid },
        select: {
            uaid: true,
            address1: true,
            address2: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            latitude: true,
            longitude: true,
            isdeleted: true
        }
    });

    if (!address || address.isdeleted) {
        throw new AppError('Address not found', 404);
    }

    return {
        success: true,
        data: address
    };
};

const getOrganizationDetails = async (uoid) => {
    const organizationWithDetails = await prisma.userorganization.findUnique({
        where: { uoid },
        select: {
            uoid: true,
            orgname: true,
            orgemail: true,
            orgmobile: true,
            isdeleted: true,
            uid: true,
            users_userorganization_uidTousers: {
                select: {
                    uid: true,
                    fullname: true,
                    emailid: true,
                    mobno: true
                }
            },
            userorgaddressmapping: {
                where: {
                    isdeleted: false
                },
                select: {
                    useraddress: {
                        select: {
                            uaid: true,
                            address1: true,
                            address2: true,
                            city: true,
                            state: true,
                            country: true,
                            pincode: true,
                            latitude: true,
                            longitude: true
                        }
                    }
                }
            }
        }
    });

    if (!organizationWithDetails || organizationWithDetails.isdeleted) {
        throw new AppError('Organization not found', 404);
    }

    // Restructure the response
    const response = {
        organization: {
            uoid: organizationWithDetails.uoid,
            orgname: organizationWithDetails.orgname,
            orgemail: organizationWithDetails.orgemail,
            orgmobile: organizationWithDetails.orgmobile
        },
        user: organizationWithDetails.users_userorganization_uidTousers,
        address: organizationWithDetails.userorgaddressmapping[0]?.useraddress || null
    };

    return {
        success: true,
        data: response
    };
};

const getAllOrganizations = async ({ page, limit, search, sortBy, sortOrder }) => {
    // Validate input parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit));
    const skip = (validatedPage - 1) * validatedLimit;

    // Build the where clause for filtering
    const whereClause = {
        isdeleted: false,
        ...(search && {
            OR: [
                { orgname: { contains: search, mode: 'insensitive' } },
                { orgemail: { contains: search, mode: 'insensitive' } }
            ]
        })
    };

    // Get total count for pagination
    const total = await prisma.userorganization.count({
        where: whereClause
    });

    // Get organizations with related data
    const organizations = await prisma.userorganization.findMany({
        where: whereClause,
        select: {
            uoid: true,
            orgname: true,
            orgemail: true,
            orgmobile: true,
            createddate: true,
            users_userorganization_uidTousers: {
                select: {
                    fullname: true,
                    emailid: true,
                    mobno: true
                }
            },
            userorgaddressmapping: {
                where: {
                    isdeleted: false
                },
                select: {
                    useraddress: {
                        select: {
                            uaid: true,
                            address1: true,
                            city: true,
                            state: true,
                            country: true,
                            pincode: true
                        }
                    }
                },
                take: 1
            }
        },
        orderBy: {
            [sortBy]: sortOrder
        },
        skip,
        take: validatedLimit
    });

    // Transform the data structure
    const transformedOrganizations = organizations.map(org => ({
        uoid: org.uoid,
        orgname: org.orgname,
        orgemail: org.orgemail,
        orgmobile: org.orgmobile,
        createddate: org.createddate,
        user: org.users_userorganization_uidTousers,
        address: org.userorgaddressmapping[0]?.useraddress || null
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / validatedLimit);

    return {
        success: true,
        data: {
            organizations: transformedOrganizations,
            pagination: {
                total,
                pages: totalPages,
                page: validatedPage,
                limit: validatedLimit
            }
        }
    };
};

const updateUserUoid = async (userId, newUoid) => {
    // First find the user's role mapping
    const roleMapping = await prisma.userrolemapping.findFirst({
        where: {
            uid: BigInt(userId),
            isdeleted: false
        }
    });

    if (!roleMapping) {
        throw new AppError('Role mapping not found for this user', 404);
    }

    // Update the role mapping using the urmid
    return await prisma.userrolemapping.update({
        where: {
            urmid: roleMapping.urmid // Using the primary key
        },
        data: {
            uoid: BigInt(newUoid),
            modifieddate: new Date()
        }
    });
};

export {
    addUser,
    getUserById,
    editUser,
    getAllUsers,
    userSearch,
    deleteUser,
    updateProfileStatus,
    updateAccountStatus,
    searchCustomerByMobile,
    getCustomers,
    findWaiterById,
    getCustomerDetails,
    saveOrganizationWithUser,
    getOrganization,
    getAddress,
    getOrganizationDetails,
    getAllOrganizations,
    updateUserUoid
};

