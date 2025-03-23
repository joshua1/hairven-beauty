import EmptyCartMessage from "@modules/cart/components/empty-cart-message"
import ItemsTemplate from "@modules/cart/templates/items"
import Summary from "@modules/cart/templates/summary"
import { HttpTypes } from "@medusajs/types"
import { Layout, LayoutColumn } from "@/components/Layout"

// TODO: Ask customer if they want to sign in or continue as guest
const CartTemplate = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  return (
    <Layout className="py-26 md:pb-36 md:pt-39">
      {cart?.items?.length ? (
        <>
          <LayoutColumn
            start={1}
            end={{ base: 13, lg: 9, xl: 10 }}
            className="mb-8 lg:mb-0"
          >
            <ItemsTemplate items={cart?.items} />
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 9, xl: 10 }} end={13}>
            {cart && cart.region && <Summary cart={cart} />}
          </LayoutColumn>
        </>
      ) : (
        <LayoutColumn start={1} end={{ base: 13 }} className="mb-14 lg:mb-0">
          <EmptyCartMessage />
        </LayoutColumn>
      )}
    </Layout>
  )
}

export default CartTemplate
