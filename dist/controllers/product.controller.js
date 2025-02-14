"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identify = void 0;
const app_1 = require("../app");
//Function to get Primary Contact and all Related Data
const getPrimaryContact = (contact) => __awaiter(void 0, void 0, void 0, function* () {
    const allEmails = new Set();
    const allPhoneNumbers = new Set();
    const allSecondaryIds = new Set();
    let linkedId = contact.linkedId;
    let primaryId;
    while (true) {
        const contact = yield app_1.prisma.contact.findUnique({
            where: {
                id: linkedId
            }
        });
        if (!contact) {
            break;
        }
        allEmails.add(contact.email);
        allPhoneNumbers.add(contact.phoneNumber);
        if ((contact === null || contact === void 0 ? void 0 : contact.linkPrecedence) === "primary" && !contact.linkedId) {
            primaryId = contact.id;
            break;
        }
        allSecondaryIds.add(contact.id);
        linkedId = contact.linkedId;
    }
    return {
        primaryId,
        emails: Array.from(allEmails),
        phoneNumbers: Array.from(allPhoneNumbers),
        secondaryContactId: Array.from(allSecondaryIds)
    };
});
const Identify = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) {
            return res.status(400).json({ message: "Please provide email or phoneNumber" });
        }
        //Declarations
        let primaryContactId;
        let allEmails = new Set();
        let allPhoneNumbers = new Set();
        let allSecondaryIds = new Array();
        const user = yield app_1.prisma.contact.findMany({
            where: {
                OR: [
                    {
                        email
                    },
                    {
                        phoneNumber
                    }
                ]
            }
        });
        //Return user if same email and phone number is found
        if (((_a = user[0]) === null || _a === void 0 ? void 0 : _a.email) == email && ((_b = user[0]) === null || _b === void 0 ? void 0 : _b.phoneNumber) == phoneNumber) {
            return res.status(200).json({
                contact: {
                    primaryContactId: user[0].id,
                    emails: user[0].email ? [user[0].email] : [],
                    phoneNumbers: user[0].phoneNumber ? [user[0].phoneNumber] : [],
                    secondaryContactId: []
                }
            });
        }
        // If no user found create a user
        if (user.length == 0) {
            const newRegisteredUser = yield app_1.prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                }
            });
            return res.status(200).json({
                contact: {
                    primaryContactId: newRegisteredUser.id,
                    emails: newRegisteredUser.email ? [newRegisteredUser.email] : [],
                    phoneNumbers: newRegisteredUser.phoneNumber ? [newRegisteredUser.phoneNumber] : [],
                    secondaryContactId: []
                }
            });
        }
        //Check if first element in array is secondary contact if yes trace trace back to primary contact        
        if (user[0].linkPrecedence === "secondary" && user[0].linkedId) {
            const { primaryId, emails, phoneNumbers, secondaryContactId } = yield getPrimaryContact(user[0]);
            //This pushes the data to the main variables if 0 element of user array is secondary contact , we check if there exist any linked id and trace down the primary contact 
            primaryContactId = primaryId;
            emails.forEach((emails) => allEmails.add(emails));
            phoneNumbers.forEach((phoneNumbers) => allPhoneNumbers.add(phoneNumbers));
            secondaryContactId.forEach((secondaryContactId) => allSecondaryIds.push(secondaryContactId));
        }
        else if (user[0].linkPrecedence === "primary") {
            primaryContactId = user[0].id;
        }
        // Check if both data received are primary contacts check if email or phone numbers dont match , if they dont match update secondary entry
        if (user[0].email != ((_c = user[1]) === null || _c === void 0 ? void 0 : _c.email) && user[0].phoneNumber != ((_d = user[1]) === null || _d === void 0 ? void 0 : _d.phoneNumber) && user[0].linkPrecedence === "primary" && ((_e = user[1]) === null || _e === void 0 ? void 0 : _e.linkPrecedence) === "primary") {
            const secondaryContact = yield app_1.prisma.contact.update({
                where: {
                    id: user[1].id
                },
                data: {
                    linkedId: user[0].id,
                    linkPrecedence: "secondary"
                }
            });
            allSecondaryIds.push(secondaryContact.id);
            allEmails.add(secondaryContact.email);
            allPhoneNumbers.add(secondaryContact.phoneNumber);
            return res.status(200).json({
                contact: {
                    primaryContactId: primaryContactId,
                    emails: Array.from(allEmails),
                    phoneNumbers: Array.from(allPhoneNumbers),
                    secondaryContactId: allSecondaryIds
                }
            });
        }
        //Pushing user data found to variables
        user.forEach((contact) => {
            if (contact.id !== primaryContactId) {
                allSecondaryIds.push(contact.id);
            }
            if (contact.email) {
                allEmails.add(contact.email);
            }
            if (contact.phoneNumber) {
                allPhoneNumbers.add(contact.phoneNumber);
            }
        });
        // Secondary Contact 
        if ((!allPhoneNumbers.has(phoneNumber) || !allEmails.has(email))) {
            const secondaryContact = yield app_1.prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkedId: user[0].id,
                    linkPrecedence: "secondary"
                }
            });
            allSecondaryIds.push(secondaryContact.id);
            allEmails.add(secondaryContact === null || secondaryContact === void 0 ? void 0 : secondaryContact.email);
            allPhoneNumbers.add(secondaryContact === null || secondaryContact === void 0 ? void 0 : secondaryContact.phoneNumber);
        }
        return res.status(200).json({
            contact: {
                primaryContactId: primaryContactId,
                emails: Array.from(allEmails),
                phoneNumbers: Array.from(allPhoneNumbers),
                secondaryContactId: allSecondaryIds
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.Identify = Identify;
