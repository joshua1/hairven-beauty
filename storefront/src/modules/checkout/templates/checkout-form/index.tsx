import { HttpTypes } from "@medusajs/types"

import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import Addresses from "@modules/checkout/components/addresses"
import Email from "@modules/checkout/components/email"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { getPaymentMethod } from "@lib/data/cart"

export default async function CheckoutForm({
  cart,
  countryCode,
}: {
  cart: HttpTypes.StoreCart | null
  countryCode: string
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }
  const paymentMethodId = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )?.data?.payment_method_id
  let paymentMethod = null
  if (paymentMethodId && typeof paymentMethodId === "string") {
    paymentMethod = await getPaymentMethod(paymentMethodId)
  }

  return (
    <>
      <Email cart={cart} countryCode={countryCode} />
      <Addresses cart={cart} />
      <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      <Payment
        cart={cart}
        availablePaymentMethods={paymentMethods}
        paymentMethod={paymentMethod}
      />
      <Review cart={cart} />
    </>
  )
}
