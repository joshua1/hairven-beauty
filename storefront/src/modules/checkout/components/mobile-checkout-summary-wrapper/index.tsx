import MobileCheckoutSummary from "@modules/checkout/templates/mobile-checkout-summary"
import { retrieveCart } from "@lib/data/cart"
import { notFound } from "next/navigation"

export default async function MobileCheckoutSummaryWrapper() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  return <MobileCheckoutSummary cart={cart} />
}
