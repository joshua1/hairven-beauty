"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { twJoin } from "tailwind-merge"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button } from "@/components/Button"
import {
  UiRadio,
  UiRadioBox,
  UiRadioGroup,
  UiRadioLabel,
} from "@/components/ui/Radio"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "shipping"

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.[0]?.shipping_option_id
  )

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <>
      <div className="flex justify-between mb-6 md:mb-8 border-t border-grayscale-200 pt-8 mt-8">
        <div>
          <p
            className={twJoin(
              "transition-fontWeight duration-75",
              isOpen && "font-semibold"
            )}
          >
            3. Shipping
          </p>
        </div>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Button
              variant="link"
              onPress={() => {
                router.push(pathname + "?step=shipping", { scroll: false })
              }}
            >
              Change
            </Button>
          )}
      </div>
      {isOpen ? (
        availableShippingMethods?.length === 0 ? (
          <div>
            <p className="text-red-900">
              There are no shipping methods available for your location. Please
              contact us for further assistance.
            </p>
          </div>
        ) : (
          <div>
            <UiRadioGroup
              className="flex flex-col gap-4 mb-8"
              value={selectedShippingMethod?.id}
              onChange={set}
              aria-label="Shipping methods"
            >
              {availableShippingMethods?.map((option) => (
                <UiRadio
                  key={option.id}
                  variant="outline"
                  value={option.id}
                  className="gap-4"
                >
                  <UiRadioBox />
                  <UiRadioLabel>{option.name}</UiRadioLabel>
                  <UiRadioLabel className="ml-auto group-data-[selected=true]:font-normal">
                    {convertToLocale({
                      amount: option.amount!,
                      currency_code: cart?.currency_code,
                    })}
                  </UiRadioLabel>
                </UiRadio>
              ))}
            </UiRadioGroup>

            <ErrorMessage error={error} />

            <Button
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={!cart.shipping_methods?.[0]}
            >
              Next
            </Button>
          </div>
        )
      ) : cart &&
        (cart.shipping_methods?.length ?? 0) > 0 &&
        selectedShippingMethod ? (
        <ul className="flex max-sm:flex-col flex-wrap gap-y-2 gap-x-28">
          <li className="text-grayscale-500">Shipping</li>
          <li className="text-grayscale-600">{selectedShippingMethod.name}</li>
        </ul>
      ) : null}
    </>
  )
}

export default Shipping
