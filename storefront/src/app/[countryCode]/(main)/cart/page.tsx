import { Metadata } from "next"
import CartTemplate from "@modules/cart/templates"

import { retrieveCart } from "@lib/data/cart"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart() {
  const cart = await retrieveCart()

  return <CartTemplate cart={cart} />
}
