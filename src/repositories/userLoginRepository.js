import prisma from "../config/prisma.js";

export const findUserByUsername = async (username) => {
    return await prisma.userlogin.findFirst({
        where: {
            username: {
                equals: username,
                mode: 'insensitive'
            },
            isdeleted: false
        }
    });
}

export const findOrgAddressByOrgId = async (effectiveOrgId) => {
    return await prisma.userorgaddressmapping.findFirst({
        where: {
            uoid: effectiveOrgId,
            isdeleted: false
        },
        select: {
            uaid: true
        }
    });
}

export const findOrgById = async (uoid) => {
    return await prisma.userorganization.findFirst({
        where: {
            uoid: uoid,
            isdeleted: false
        },
        select: {
            orgname: true
        }
    });
}

export const updateLoginTime = async (ulid) => {
    return await prisma.userlogin.update({
        where: {
            ulid: ulid
        },
        data: {
            logintime: new Date()
        }
    });
}

export const updateLogoutTime = async (ulid) => {
    return await prisma.userlogin.update({
        where: {
            ulid: ulid
        },
        data: {
            logouttime: new Date()
        }
    });
}