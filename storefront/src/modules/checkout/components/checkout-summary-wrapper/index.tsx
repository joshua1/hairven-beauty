import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { retrieveCart } from "@lib/data/cart"
import { notFound } from "next/navigation"

export default async function CheckoutSummaryWrapper() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  return <CheckoutSummary cart={cart} />
}
