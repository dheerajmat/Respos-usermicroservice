import express from 'express';
import { addCustomer, addUser, deleteUser, editUser, getAllUsers, getCustomerDetails, getCustomers, getsaveusermodal, getUserById, getWaiterById, searchCustomerByMobile, updateAccountStatus, updateProfileStatus, userSearch, saveOrganizationWithUser, getOrganization, getAddress, getOrganizationDetails, getAllOrganizations, updateSuperAdminUoid } from '../controllers/userController.js';

const router = express.Router();


/**
 * @swagger
 * /api/v2/users/search-customer/{mobile}:
 *   get:
 *     summary: Search for a customer by mobile number
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mobile
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer's mobile number
 *     responses:
 *       200:
 *         description: Customer found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: integer
 *                         fullname:
 *                           type: string
 *                         mobno:
 *                           type: string
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/search-customer/:mobile', searchCustomerByMobile);

/**
 * @swagger
 * /api/v2/users/organizations:
 *   get:
 *     summary: Get all organizations with pagination and filters
 *     tags: [Organization]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for organization name or email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [orgname, createddate]
 *         default: createddate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of organizations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uoid:
 *                             type: integer
 *                           orgname:
 *                             type: string
 *                           orgemail:
 *                             type: string
 *                           orgmobile:
 *                             type: string
 *                           createddate:
 *                             type: string
 *                             format: date-time
 *                           address:
 *                             type: object
 *                             properties:
 *                               address1:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                               state:
 *                                 type: integer
 *                               country:
 *                                 type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               fullname:
 *                                 type: string
 *                               emailid:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of organizations
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *                         page:
 *                           type: integer
 *                           description: Current page
 *                         limit:
 *                           type: integer
 *                           description: Items per page
 *       400:
 *         description: Invalid parameters
 */
router.get('/organizations', getAllOrganizations);


/**
 * @swagger
 * /api/v2/users/customers:
 *   post:
 *     summary: Get filtered customers with pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Filter customers by name (partial match)
 *               phoneNumber:
 *                 type: string
 *                 description: Filter customers by phone number (partial match)
 *               pagination:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                     default: 1
 *                   limit:
 *                     type: integer
 *                     default: 10
 *     responses:
 *       200:
 *         description: List of customers retrieved successfully
 *       500:
 *         description: Server error
 */
router.post('/customers', getCustomers);


/**
 * @swagger
 * components:
 *   schemas:
 *     RightsList:
 *       type: object
 *       required:
 *         - rightId
 *         - rightName
 *         - selected
 *       properties:
 *         rightId:
 *           type: integer
 *           description: The ID of the right
 *         rightName:
 *           type: string
 *           description: The name of the right
 *         selected:
 *           type: boolean
 *           description: Whether the right is selected
 *     Module:
 *       type: object
 *       required:
 *         - moduleName
 *         - rightsList
 *       properties:
 *         moduleName:
 *           type: string
 *           description: The name of the module
 *         rightsList:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RightsList'
 *     RightsOfUserModel:
 *       type: object
 *       required:
 *         - modules
 *       properties:
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Module'
 *     RoleModel:
 *       type: object
 *       required:
 *         - uoid
 *         - roleid
 *         - roletypeid
 *       properties:
 *         uoid:
 *           type: integer
 *           description: The organization ID
 *         roleid:
 *           type: integer
 *           description: The role ID
 *         roletypeid:
 *           type: integer
 *           description: The role type ID
 *     User:
 *       type: object
 *       required:
 *         - fullname
 *         - firstname
 *         - lastname
 *         - emailid
 *         - mobno
 *         - employeeid
 *         - canlogin
 *         - password
 *         - usercode
 *         - profilestatus
 *         - isapproved
 *         - accountstatus
 *         - roleid
 *         - roleName
 *         - roleModels
 *         - rightsOfUserModel
 *       properties:
 *         fullname:
 *           type: string
 *           description: The full name of the user
 *         firstname:
 *           type: string
 *           description: The first name of the user
 *         lastname:
 *           type: string
 *           description: The last name of the user
 *         emailid:
 *           type: string
 *           description: The email of the user
 *         mobno:
 *           type: string
 *           description: The mobile number of the user
 *         employeeid:
 *           type: string
 *           description: The employee ID of the user
 *         canlogin:
 *           type: boolean
 *           description: Whether the user can login
 *         password:
 *           type: string
 *           description: The password of the user
 *         usercode:
 *           type: string
 *           description: The user code
 *         image:
 *           type: string
 *           description: The user's image URL
 *         profilestatus:
 *           type: integer
 *           description: The profile status
 *         isapproved:
 *           type: boolean
 *           description: Whether the user is approved
 *         accountstatus:
 *           type: integer
 *           description: The account status
 *         roleid:
 *           type: integer
 *           description: The role ID
 *         roleName:
 *           type: string
 *           description: The role name
 *         roleModels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoleModel'
 *         rightsOfUserModel:
 *           $ref: '#/components/schemas/RightsOfUserModel'
 *     UserResponse:
 *       type: object
 *       properties:
 *         uid:
 *           type: integer
 *           description: The user ID
 *         fullname:
 *           type: string
 *           description: The full name of the user
 *         emailid:
 *           type: string
 *           description: The email of the user
 *         message:
 *           type: string
 *           description: A success message
 */



/**
 * @swagger
 * /api/v2/users/getsaveusermodal:
 *   get:
 *     summary: Get save user modal data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/getsaveusermodal', getsaveusermodal);


/**
 * @swagger
 * /api/v2/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', addUser);


/**
 * @swagger
 * /api/v2/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: integer
 *                         fullname:
 *                           type: string
 *                         emailid:
 *                           type: string
 *                         role_mappings:
 *                           type: array
 *                           items:
 *                             type: object
 *                         rights_mappings:
 *                           type: array
 *                           items:
 *                             type: object
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserById);



/**
 * @swagger
 * /api/v2/users/updateusers/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               emailid:
 *                 type: string
 *               mobno:
 *                 type: string
 *               canlogin:
 *                 type: boolean
 *               password:
 *                 type: string
 *               usercode:
 *                 type: string
 *               image:
 *                 type: string
 *               profilestatus:
 *                 type: integer
 *               isapproved:
 *                 type: boolean
 *               accountstatus:
 *                 type: integer
 *               isadmin:
 *                 type: boolean
 *               employeeid:
 *                 type: string
 *               updatedby:
 *                 type: integer
 *               roleModels:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/RoleModel'
 *               rightsOfUserModel:
 *                 $ref: '#/components/schemas/RightsOfUserModel'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: integer
 *                     fullname:
 *                       type: string
 *                     emailid:
 *                       type: string
 *                     role_mappings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RoleModel'
 *                     rights_mappings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rightid:
 *                             type: integer
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/updateusers/:id', editUser);


/**
 * @swagger
 * /api/v2/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: integer
 *                       fullname:
 *                         type: string
 *                       emailid:
 *                         type: string
 *                       role_mappings:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/RoleModel'
 *                       rights_mappings:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             rightid:
 *                               type: integer
 */
router.get('/', getAllUsers);


/**
 * @swagger
 * /api/v2/users/filter:
 *   post:
 *     summary: Search for users
 *     description: Searches for users based on provided parameters such as name, profile status, account status, role, and exclude role, with pagination support.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user to search for (supports partial matching)
 *                 example: "John Doe"
 *               profilestatus:
 *                 type: integer
 *                 description: Profile status of the user (5, 6, 7, 8)
 *                 example: 8
 *               accountstatus:
 *                 type: integer
 *                 description: Account status of the user (9, 10, 11, 12, 13, 14, 15)
 *                 example: 9
 *               role:
 *                 type: integer
 *                 description: Role ID to filter users by
 *                 example: 1
 *               exclude:
 *                 type: integer
 *                 description: Role ID to exclude from results
 *                 example: 3
 *               pagination:
 *                 type: object
 *                 properties:
 *                   itemPerPage:
 *                     type: integer
 *                     description: Number of items per page
 *                     example: 10
 *                   currentPage:
 *                     type: integer
 *                     description: The current page number
 *                     example: 1
 *     responses:
 *       200:
 *         description: Successful search operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uid:
 *                             type: integer
 *                             example: 1
 *                           fullname:
 *                             type: string
 *                             example: "John Doe"
 *                           emailid:
 *                             type: string
 *                             example: "john@example.com"
 *                           mobno:
 *                             type: string
 *                             example: "1234567890"
 *                           profilestatus:
 *                             type: integer
 *                             example: 8
 *                           accountstatus:
 *                             type: integer
 *                             example: 9
 *                           roleid:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                           example: 100
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input parameters"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/filter', userSearch);


/**
 * @swagger
 * /api/v2/users/delete/{id}:
 *   delete:
 *     summary: Mark a user as deleted
 *     description: Sets the "isdeleted" field to true for a specific user without removing them from the database.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the user to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User successfully marked as deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User marked as deleted successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

router.delete('/delete/:id', deleteUser);

/**
 * @swagger
 * /api/v2/users/{id}/profile-status:
 *   patch:
 *     summary: Update user profile status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileStatus
 *             properties:
 *               profileStatus:
 *                 type: integer
 *                 description: New profile status
 *     responses:
 *       200:
 *         description: Profile status updated successfully
 *       500:
 *         description: Server error
 */
router.patch('/:id/profile-status', updateProfileStatus);

/**
 * @swagger
 * /api/v2/users/{id}/account-status:
 *   patch:
 *     summary: Update user account status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountStatus
 *             properties:
 *               accountStatus:
 *                 type: integer
 *                 description: New account status
 *     responses:
 *       200:
 *         description: Account status updated successfully
 *       500:
 *         description: Server error
 */
router.patch('/:id/account-status', updateAccountStatus);

/**
 * @swagger
 * /api/v2/users/customer:
 *   post:
 *     summary: Add a new customer
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - mobno
 *             properties:
 *               fullname:
 *                 type: string
 *                 description: Customer's full name
 *               mobno:
 *                 type: string
 *                 description: Customer's mobile number
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/customer', addCustomer);

/**
 * @swagger
 * /api/v2/users/waiter/{waiterId}:
 *   get:
 *     summary: Get all bookings for a specific waiter with table details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: waiterId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Waiter's bookings retrieved successfully
 */
router.get('/waiter/:waiterId', getWaiterById);

/**
 * @swagger
 * /api/v2/users/customer/{customerId}:
 *   post:
 *     summary: Get customer details with their orders
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 default: 1
 *                 description: Page number for pagination
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of items per page
 *             example:
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                           example: "405"
 *                         fullname:
 *                           type: string
 *                           example: "mk"
 *                         emailid:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         mobno:
 *                           type: string
 *                           example: "7014400238"
 *                         joined_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-02-10T06:56:26.078Z"
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderid:
 *                             type: string
 *                             example: "499"
 *                           orderno:
 *                             type: integer
 *                             example: 0
 *                           orderdate:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-02-10T06:56:28.086Z"
 *                           orderstatus:
 *                             type: string
 *                             example: "30"
 *                           orderitemtotal:
 *                             type: string
 *                             example: "70"
 *                           ordertaxtotal:
 *                             type: string
 *                             example: "1.4"
 *                           orderdiscount:
 *                             type: string
 *                             example: "0"
 *                           ordertotal:
 *                             type: string
 *                             example: "71.4"
 *                           paymentstatus:
 *                             type: string
 *                             nullable: true
 *                           shippingstatus:
 *                             type: string
 *                             nullable: true
 *                           table_id:
 *                             type: string
 *                             example: "0"
 *                           serving_type:
 *                             type: string
 *                             example: "34"
 *                     total_orders:
 *                       type: integer
 *                       example: 1
 *                     total_spent:
 *                       type: number
 *                       example: 71.4
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 1
 *                         pages:
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/customer/:customerId', getCustomerDetails);


// /**
//  * @swagger
//  * /api/v2/users/{userId}/orders:
//  *   get:
//  *     summary: Get all orders for a specific user
//  *     tags: [Users]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: userId
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: User ID
//  *     responses:
//  *       200:
//  *         description: User orders retrieved successfully
//  *       404:
//  *         description: User not found
//  *       500:
//  *         description: Server error
//  */
// router.get('/:userId/orders', getUserOrders);

/**
 * @swagger
 * /api/v2/users/organization:
 *   post:
 *     summary: Create a new organization with associated user and address
 *     description: Creates a new organization along with a user account and address details. Links all entities together.
 *     tags: [Organization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgName
 *               - orgEmail
 *               - orgMobile
 *               - orgAddress
 *               - userFullName
 *               - userFirstName
 *               - password
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID for reference (can be 0 for new entries)
 *                 example: 0
 *               orgName:
 *                 type: string
 *                 description: Name of the organization
 *                 example: "Fresh Farms Market"
 *               orgEmail:
 *                 type: string
 *                 format: email
 *                 description: Organization's email address
 *                 example: "freshfarms@example.com"
 *               orgMobile:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 description: Organization's contact number
 *                 example: "9876543210"
 *               orgAddress:
 *                 type: object
 *                 required:
 *                   - address1
 *                   - city
 *                   - state
 *                   - country
 *                   - pincode
 *                 properties:
 *                   uaid:
 *                     type: integer
 *                     description: Address ID (0 for new address)
 *                     example: 0
 *                   address1:
 *                     type: string
 *                     description: Primary address line
 *                     example: "123 Market Street"
 *                   address2:
 *                     type: string
 *                     description: Secondary address line
 *                     example: "Near Central Park"
 *                   city:
 *                     type: string
 *                     description: City name
 *                     example: "Mumbai"
 *                   state:
 *                     type: integer
 *                     description: State ID from master data
 *                     example: 1
 *                   country:
 *                     type: string
 *                     description: Country ID from master data
 *                     example: "5"
 *                   pincode:
 *                     type: string
 *                     pattern: "^[0-9]{6}$"
 *                     description: Postal code
 *                     example: "400001"
 *                   latitude:
 *                     type: string
 *                     description: Latitude coordinates
 *                     example: "19.0760"
 *                   longitude:
 *                     type: string
 *                     description: Longitude coordinates
 *                     example: "72.8777"
 *               userRoleTypeId:
 *                 type: integer
 *                 description: Role type ID for the user
 *                 example: 6
 *               userFullName:
 *                 type: string
 *                 description: Full name of the user
 *                 example: "John Smith"
 *               userFirstName:
 *                 type: string
 *                 description: First name of the user
 *                 example: "John"
 *               userLastName:
 *                 type: string
 *                 description: Last name of the user
 *                 example: "Smith"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User account password
 *                 example: "Pass@123"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the organization is active
 *                 example: true
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     organization:
 *                       type: object
 *                       properties:
 *                         uoid:
 *                           type: integer
 *                           description: Organization ID
 *                           example: 1
 *                         orgName:
 *                           type: string
 *                           description: Organization name
 *                           example: "Fresh Farms Market"
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: integer
 *                           description: User ID
 *                           example: 1
 *                         fullName:
 *                           type: string
 *                           description: User's full name
 *                           example: "John Smith"
 *                     address:
 *                       type: object
 *                       properties:
 *                         uaid:
 *                           type: integer
 *                           description: Address ID
 *                           example: 1
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email or mobile number already exists"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/organization', saveOrganizationWithUser);

/**
 * @swagger
 * /api/v2/users/organization/{uoid}:
 *   get:
 *     summary: Get organization details by ID
 *     tags: [Organization]
 *     parameters:
 *       - in: path
 *         name: uoid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uoid:
 *                       type: integer
 *                     orgname:
 *                       type: string
 *                     orgemail:
 *                       type: string
 *                     orgmobile:
 *                       type: string
 *       404:
 *         description: Organization not found
 *
 * /api/v2/users/address/{uaid}:
 *   get:
 *     summary: Get address details by ID
 *     tags: [Organization]
 *     parameters:
 *       - in: path
 *         name: uaid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *
 * /api/v2/users/organization/{uoid}/details:
 *   get:
 *     summary: Get organization details with associated address
 *     tags: [Organization]
 *     parameters:
 *       - in: path
 *         name: uoid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization and address details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     organization:
 *                       $ref: '#/components/schemas/Organization'
 *                     address:
 *                       $ref: '#/components/schemas/Address'
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: Organization not found
 */
router.get('/organization/:uoid', getOrganization);
router.get('/address/:uaid', getAddress);
router.get('/organization/:uoid/details', getOrganizationDetails);

/**
 * @swagger
 * /api/v2/users/organizations/list:
 *   get:
 *     summary: Get simplified list of organizations (ID and name only)
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uoid:
 *                     type: integer
 *                     description: Organization ID
 *                     example: 1
 *                   orgname:
 *                     type: string
 *                     description: Organization name
 *                     example: "Fresh Farms Market"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 * /api/v2/users/super-admin/uoid:
 *   patch:
 *     summary: Update super admin's organization ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newUoid
 *             properties:
 *               newUoid:
 *                 type: integer
 *                 description: New organization ID to be assigned
 *                 example: 2
 *     responses:
 *       200:
 *         description: Organization ID updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: integer
 *                   description: User ID
 *                 uoid:
 *                   type: integer
 *                   description: Updated organization ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a super admin
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/organizations/list', getAllOrganizations);
router.patch('/super-admin/uoid', updateSuperAdminUoid);

export default router;