import * as userService from '../services/userService.js';
import { AppError } from '../middleware/errorHandler.js';
import { serializeData } from '../utils/serializer.js';
import logger from '../utils/logger.js';

const addUser = async (req, res, next) => {
    try {
        if (!req.body.emailid || !req.body.password) {
            return next(new AppError('Please provide email and password!', 400));
        }
        console.log(req.user);

        const userData = await userService.addUser(req.body, req.user.uid, req.user.uoid);

        res.status(201).json(userData);
    } catch (error) {
        logger.warn('Error adding user', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
};

// const addUser = async (req, res, next) => {
//     try {
//         if (!req.body.emailid || !req.body.password) {
//             throw new AppError('Please provide email and password!', 400);
//         }

//         const userData = await userService.addUser(req.body);

//         // Remove sensitive data before sending response
//         const { password, ...userResponse } = userData;

//         res.status(201).json(userResponse);
//     } catch (error) {
//         logger.error('Error adding user', {
//             error: error.message,
//             stack: error.stack
//         });
//         next(error);
//     }
// };

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.status(200).json(user);
    } catch (error) {
        logger.warn('Error adding user', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const getsaveusermodal = async (req, res, next) => {
    const ROLES = {
        // SUPER_ADMIN: 1,
        OUTLET_MANAGER: 2,
        WAITER: 3,
        KITCHEN_MANAGER: 4,
        INVENTORY_MANAGER: 5
    };

    const roleDropdown = [
        // { id: ROLES.SUPER_ADMIN, name: "Super Admin" },
        { id: ROLES.OUTLET_MANAGER, name: "Outlet Manager" },
        { id: ROLES.WAITER, name: "Waiter" },
        { id: ROLES.KITCHEN_MANAGER, name: "Kitchen Manager" },
        { id: ROLES.INVENTORY_MANAGER, name: "Inventory Manager" }
    ];

    try {
        const userModalData = {
            fullname: "",
            firstname: "",
            lastname: "",
            emailid: "",
            mobno: "",
            employeeid: "",
            canlogin: true,
            password: "",
            usercode: "",
            image: "",
            profilestatus: 0,
            isapproved: true,
            accountstatus: 0,
            roleid: 0,
            roleName: "",
            roleModels: [
                {
                    uoid: 0,
                    roleid: 0,
                    roletypeid: 0
                }
            ],
            // rightsOfUserModel: {
            //   modules: [
            //     {
            //       moduleName: "",
            //       rightsList: [
            //         {
            //           rightId: 0,
            //           rightName: "",
            //           selected: true
            //         }
            //       ]
            //     }
            //   ]
            // }
        };

        // Send userModalData along with roles dropdown
        res.status(200).json({
            userModalData,
            roles: roleDropdown
        });
    } catch (error) {
        logger.warn('Error getting save user modal data', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const editUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const modifiedby = req.user.uid;
        const userData = req.body;
        const uoid = req.user.uoid;

        // If password is unchanged (matches the bcrypt pattern), remove it from update
        if (userData.password?.startsWith('$2b$')) {
            console.log('Password is unchanged');
            delete userData.password;
        }

        const updatedUser = await userService.editUser(userId, userData, modifiedby, uoid);
        logger.info('User updated successfully', { userId });
        res.status(200).json(updatedUser);

    } catch (error) {
        logger.error('Error in updateUser controller', {
            error: error.message,
            stack: error.stack,
            userId: req.params.id
        });
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers(req.user.uoid);
        res.status(200).json(users)
    } catch (error) {
        logger.error('Error fetching all users', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
}

const userSearch = async (req, res, next) => {
    try {
        const uoid = req.user.uoid;

        // Validate and sanitize pagination parameters
        const pagination = {
            itemsPerPage: parseInt(req.body.pagination?.itemPerPage) || 10,
            currentPage: parseInt(req.body.pagination?.currentPage) || 1
        };

        // Validate and sanitize search terms
        const searchTerms = {
            name: req.body.name || '',
            profilestatus: req.body.profilestatus || '',
            accountstatus: req.body.accountstatus || '',
            role: req.body.role || null,
            exclude: req.body.exclude || null,
            uoid
        };

        const results = await userService.userSearch(searchTerms, pagination);

        res.status(200).json({
            success: true,
            data: serializeData(results)
        });
    } catch (error) {
        logger.error('Error in user search:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
}

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const deletedby = req.user.uid;
        await userService.deleteUser(userId, deletedby);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        logger.error('Error deleting user', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const updateProfileStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { profileStatus } = req.body;
        const updatedUser = await userService.updateProfileStatus(userId, profileStatus);
        res.status(200).json(updatedUser);
    } catch (error) {
        logger.error('Error updating profile status', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const updateAccountStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { accountStatus } = req.body;
        const updatedUser = await userService.updateAccountStatus(userId, accountStatus);
        res.status(200).json(updatedUser);
    } catch (error) {
        logger.error('Error updating account status', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const addCustomer = async (req, res, next) => {
    try {
        const customerData = {
            fullname: req.body.fullname,
            mobno: req.body.mobno,
            canlogin: false, // Customers don't need login by default
            roleModels: [{ roleid: 7 }], // Customer role
            createdby: req.user.uid
        }

        const customer = await userService.addUser(customerData, req.user.uid);
        res.status(201).json(customer);
    } catch (error) {
        logger.error('Error adding customer', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const searchCustomerByMobile = async (req, res, next) => {
    try {
        const { mobile } = req.params;

        if (!mobile || mobile.length < 4) {
            return res.status(400).json({ message: 'Please enter at least 4 digits of mobile number' });
        }

        // Clean the mobile number - keep only digits
        const cleanMobile = mobile.toString().replace(/\D/g, '');

        const customers = await userService.searchCustomerByMobile(cleanMobile);

        res.status(200).json(customers);
    } catch (error) {
        logger.error('Error in searchCustomerByMobile', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const getCustomers = async (req, res, next) => {
    try {
        const filters = {
            name: req.body.name || '',
            phoneNumber: req.body.phoneNumber || ''
        };

        const pagination = {
            page: parseInt(req.body.pagination?.page) || 1,
            limit: parseInt(req.body.pagination?.limit) || 10
        };

        const result = await userService.getCustomers(filters, pagination);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error getting customers', {
            error: error.message,
            stack: error.stack
        })
        next(error);
    }
}

const getWaiterById = async (req, res, next) => {
    try {
        const waiterId = parseInt(req.params.waiterId);
        
        if (isNaN(waiterId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid waiter ID'
            });
        }

        const waiterData = await userService.findWaiterById(waiterId);
        
        if (!waiterData) {
            return res.status(404).json({
                success: false,
                message: 'Waiter not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                waiter: waiterData.waiter,
                total_bookings: waiterData.total_bookings,
                grouped_bookings: waiterData.grouped_bookings,
                all_bookings: waiterData.all_bookings
            }
        });
    } catch (error) {
        logger.error('Error getting waiter bookings:', error);
        next(error);
    }
}

const getCustomerDetails = async (req, res, next) => {
    try {
        const customerId = BigInt(req.params.customerId);
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;

        const customerDetails = await userService.getCustomerDetails(customerId, page, limit);
        res.json(customerDetails);
    } catch (error) {
        logger.error('Error getting customer details', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
}

const saveOrganizationWithUser = async (req, res, next) => {
    try {
        const result = await userService.saveOrganizationWithUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        logger.error('Error in saveOrganizationWithUser:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
};

const getOrganization = async (req, res, next) => {
    try {
        const { uoid } = req.params;
        const result = await userService.getOrganization(BigInt(uoid));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getAddress = async (req, res, next) => {
    try {
        const { uaid } = req.params;
        const result = await userService.getAddress(BigInt(uaid));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getOrganizationDetails = async (req, res, next) => {
    try {
        const { uoid } = req.params;
        const result = await userService.getOrganizationDetails(BigInt(uoid));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getAllOrganizations = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            sortBy = 'createddate', 
            sortOrder = 'desc' 
        } = req.query;

        const result = await userService.getAllOrganizations({
            page: parseInt(page),
            limit: parseInt(limit),
            search: search.toString(),
            sortBy,
            sortOrder
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

const updateSuperAdminUoid = async (req, res, next) => {
    try {
        const { newUoid } = req.body;
        const userId = req.user.uid; // Assuming the user ID is available in the request
        const updatedUser = await userService.updateUserUoid(userId, newUoid);
        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};

export {
    addUser,
    getUserById,
    getsaveusermodal,
    editUser,
    getAllUsers,
    userSearch,
    deleteUser,
    updateProfileStatus,
    updateAccountStatus,
    addCustomer,
    searchCustomerByMobile,
    getCustomers,
    getWaiterById,
    getCustomerDetails,
    saveOrganizationWithUser,
    getOrganization,
    getAddress,
    getOrganizationDetails,
    getAllOrganizations,
    updateSuperAdminUoid
};