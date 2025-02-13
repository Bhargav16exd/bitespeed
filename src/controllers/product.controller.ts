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
        let allemails = new Set();
        let allPhoneNumbers = new Set();
        let allSecondaryIds = new Set();

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

        console.log("List of all Related Data found",user)

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


            //Primary Contact
            primaryContactId = primaryId

            return res.status(200).json({
                contact:{
                    primaryContactId,
                    emails,
                    phoneNumbers,
                    secondaryContactId
                }
            })
        }


        
       
       
       //All contact details
       allPhoneNumbers = new Set(user.map(c => c.phoneNumber).filter(Boolean));

       //All emails
       const allEmails = new Set(user.map(c => c.email).filter(Boolean));

       //Secondary Contact IDs
       const secondaryContactIDs = user.filter(contact=>contact.id !== primaryContactId.id).map(contact=>contact.id)



       // Secondary Contact tab banega jab kuch ek common hoga like email and new thing will be phone number or vice versa
       if(!allPhoneNumbers.has(phoneNumber) || !allEmails.has(email)){

            const secondaryContact = await prisma.contact.create({
                data:{
                    email,
                    phoneNumber,
                    linkedId:primaryContactId.id,
                    linkPrecedence:"secondary"
                }
            })
       }

       console.log("Contact Array",Array(allPhoneNumbers))
       console.log("Email Array",Array(allEmails))
       console.log("Secondary Contact",secondaryContactIDs)




       return res.status(200).json(
        {
            contact:{
                primaryContactId:primaryContactId.id,
                emails:Array.from(allEmails),
                phoneNumbers:Array.from(allPhoneNumbers),
                secondaryContactId:secondaryContactIDs
            }
        }
    )
    
        
    } catch (error) {
        next(error)
    }
}