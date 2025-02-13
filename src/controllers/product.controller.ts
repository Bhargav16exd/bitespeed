import { prisma } from "../app";


//Function to get Primary Contact and all Related Data
const getPrimaryContact = async (contact:any)=>{

    const allEmails = new Set();
    const allPhoneNumbers = new Set();
    const allSecondaryIds = new Set();
    let linkedId = contact.linkedId;
    let primaryId

    while(true){
        const contact = await prisma.contact.findUnique({
            where:{
                id:linkedId
            }
        })

        if(!contact){
            break;
        }


        allEmails.add(contact.email)
        allPhoneNumbers.add(contact.phoneNumber)
        
        if(contact?.linkPrecedence === "primary" && !contact.linkedId){
            primaryId = contact.id;
            break;
        }
        
        allSecondaryIds.add(contact.id)
        linkedId = contact.linkedId

    }


    return {
        primaryId,
        emails:Array.from(allEmails),
        phoneNumbers:Array.from(allPhoneNumbers),
        secondaryContactId:Array.from(allSecondaryIds)
    }
    
}


export const Identify = async (req:any,res:any,next:any) =>{
    try {

        const {email,phoneNumber} = req.body;

        if(!email && !phoneNumber){
            return res.status(400).json({message:"Please provide email or phoneNumber"})
        }

        //Declarations
        let primaryContactId :any;
        let allEmails = new Set();
        let allPhoneNumbers = new Set();
        let allSecondaryIds = new Array();

        const user = await prisma.contact.findMany({
            where:{
                OR:[
                    {
                        email
                    },
                    {
                        phoneNumber
                    }
                ]
            }
        })


        //Returns if same data is found
        if(user[0]?.email == email && user[0]?.phoneNumber == phoneNumber){
            return res.status(200).json(
                {
                    contact:{
                        primaryContactId:user[0].id,
                        emails:user[0].email ? [user[0].email] : [],
                        phoneNumbers:user[0].phoneNumber ? [user[0].phoneNumber] : [],
                        secondaryContactId:[]
                    }
                }
            )
        }


        // If no user found create a user
        if(user.length == 0 ){

            const newRegisteredUser = await prisma.contact.create({
                data:{
                    email,
                    phoneNumber,
                }
            })

            return res.status(200).json(
                {
                    contact:{
                        primaryContactId:newRegisteredUser.id,
                        emails:newRegisteredUser.email ? [newRegisteredUser.email] : [],
                        phoneNumbers:newRegisteredUser.phoneNumber ? [newRegisteredUser.phoneNumber] : [],
                        secondaryContactId:[]
                    }
                }
            )
        }

        //Check if first element in array is secondary contact if yes trace trace back to primary contact        
        if(user[0].linkPrecedence === "secondary" && user[0].linkedId){
            const {
                primaryId,
                emails,
                phoneNumbers,
                secondaryContactId
            } : any = await getPrimaryContact(user[0])


            //This pushes the data to the main variables if 0 element of user array is secondary contact , we check if there exist any linked id and trace down the primary contact 
            primaryContactId = primaryId
            emails.forEach((emails:any)=>allEmails.add(emails))
            phoneNumbers.forEach((phoneNumbers:any)=>allPhoneNumbers.add(phoneNumbers))
            secondaryContactId.forEach((secondaryContactId:any)=>allSecondaryIds.push(secondaryContactId))
        }
        else if (user[0].linkPrecedence === "primary"){
            primaryContactId = user[0].id
        }
       


        // Check if both data received are primary contacts check if email or phone numbers dont match , if they dont match update secondary entry
        if(user[0].email != user[1]?.email && user[0].phoneNumber != user[1]?.phoneNumber && user[0].linkPrecedence === "primary" && user[1]?.linkPrecedence === "primary"){

            const secondaryContact = await prisma.contact.update({
                where:{
                    id:user[1].id
                },
                data:{
                    linkedId:user[0].id,
                    linkPrecedence:"secondary"
                }
            })

            allSecondaryIds.push(secondaryContact.id)
            allEmails.add(secondaryContact.email)
            allPhoneNumbers.add(secondaryContact.phoneNumber)

            return res.status(200).json({
                contact:{
                    primaryContactId:primaryContactId,
                    emails:Array.from(allEmails),
                    phoneNumbers:Array.from(allPhoneNumbers),
                    secondaryContactId:allSecondaryIds
                }
            })




        }
        

         //Pushing user data found to variables
         user.forEach((contact:any)=>{
            if (contact.id !== primaryContactId) {
                allSecondaryIds.push(contact.id);
            }
            if (contact.email) {
                allEmails.add(contact.email);
            }
            if (contact.phoneNumber) {
                allPhoneNumbers.add(contact.phoneNumber);
            }
        })


       // Secondary Contact 
       if((!allPhoneNumbers.has(phoneNumber) || !allEmails.has(email)) ){

            const secondaryContact = await prisma.contact.create({
                data:{
                    email,
                    phoneNumber,
                    linkedId:user[0].id,
                    linkPrecedence:"secondary"
                }
            })

            allSecondaryIds.push(secondaryContact.id)
            allEmails.add(secondaryContact?.email)
            allPhoneNumbers.add(secondaryContact?.phoneNumber)
    
       }


       return res.status(200).json(
        {
            contact:{
                primaryContactId:primaryContactId,
                emails:Array.from(allEmails),
                phoneNumbers:Array.from(allPhoneNumbers),
                secondaryContactId:allSecondaryIds
            }
        }
    )
    
        
    } catch (error) {
        next(error)
    }
}