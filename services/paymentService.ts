import { getSchoolId } from './utils';

declare var Cashfree: any;

// NOTE: In a real environment, `paymentSessionId` must be generated from your Backend
// using Cashfree's PG Create Order API. The frontend should never create orders directly
// for security reasons due to Client Secret exposure.

// This service assumes you have a backend endpoint that returns { payment_session_id }
// If no backend is available, we simulate the flow for demonstration.

export const initializePayment = async (amount: number, customerPhone: string, customerName: string) => {
    try {
        const cashfree = new Cashfree({
            mode: "sandbox" // Change to "production" for live
        });

        const orderId = `ORDER_${getSchoolId()?.substring(0,8)}_${Date.now()}`;
        
        // --- REAL IMPLEMENTATION PATTERN ---
        /*
        const response = await fetch('https://your-backend-api.com/create-order', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
               orderId, 
               amount, 
               customerPhone, 
               customerName, 
               customerId: getSchoolId() 
           })
        });
        const { payment_session_id } = await response.json();
        
        if(payment_session_id) {
             const checkoutOptions = {
                paymentSessionId: payment_session_id,
                redirectTarget: "_modal",
            };
            return new Promise((resolve) => {
                cashfree.checkout(checkoutOptions).then((result: any) => {
                    if(result.error){
                        resolve({ success: false, message: result.error.message });
                    }
                    if(result.redirect){
                        // Redirection handled by Cashfree
                    }
                    if(result.paymentDetails){
                        resolve({ success: true, transactionId: result.paymentDetails.paymentMessage });
                    }
                });
            });
        }
        */
        
        // --- SIMULATION FOR PROTOTYPE ---
        console.log(`[Cashfree Mock] Initializing payment for ₹${amount}. Order: ${orderId}`);
        
        return new Promise<{success: boolean, transactionId?: string, message?: string}>((resolve) => {
            // Simulate API delay
            setTimeout(() => {
                // Determine random success/failure for demo realism
                const isSuccess = true; 
                
                if (isSuccess) {
                    const mockTxn = `CF_TEST_${Math.floor(Math.random() * 10000000)}`;
                    resolve({ 
                        success: true, 
                        transactionId: mockTxn,
                        message: "Payment Successful"
                    });
                } else {
                    resolve({ 
                        success: false, 
                        message: "Payment Failed by Bank"
                    });
                }
            }, 3000);
        });

    } catch (error: any) {
        console.error("Payment Error:", error);
        return { success: false, message: error.message };
    }
};