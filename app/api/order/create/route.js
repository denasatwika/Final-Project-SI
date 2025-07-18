import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";



export async function POST(request) {
    try {
        
        const { userId } = getAuth(request)
        const { address, items } = await request.json()
        
        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid Data" }, { status: 400 });
        } 

        // calculate amonunt using items
        const amount = await items.reduce(async (total, item) => {
            const product = await Product.findById(item.product);
            return total + product.offerPrice * item.quantity;
        }, 0 )

        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                amount: amount + Math.floor(amount * 0.02),
                date: Date.now()
            }
        })

        // clear user card
        const user = await User.findById(userId)
        user.cartItems = {}
        await user.save()

        return NextResponse.json( { success: true, message: 'Order Placed' })

    } catch (error) {
        console.log(error)
        return NextResponse.json( { success: false, message: error.message })
    }
}