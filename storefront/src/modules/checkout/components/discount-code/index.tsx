"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"

import { applyPromotions } from "@lib/data/cart"
import { Form, InputField } from "@/components/Forms"
import { codeFormSchema } from "@modules/cart/components/discount-code"
import { SubmitButton } from "@modules/common/components/submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const { promotions = [] } = cart
  const addPromotionCode = async (values: { code: string }) => {
    if (!values.code) {
      return
    }
    const codes = promotions
      .filter((p) => p.code === undefined)
      .map((p) => p.code!)
    codes.push(values.code)

    await applyPromotions(codes)
  }

  return (
    <Form onSubmit={addPromotionCode} schema={codeFormSchema}>
      <div className="flex max-sm:flex-col gap-x-6 gap-y-4 mb-8">
        <InputField
          name="code"
          inputProps={{ autoFocus: false, className: "max-lg:h-12" }}
          placeholder="Discount code"
          className="flex-1"
        />
        <SubmitButton className="lg:h-auto max-h-14 grow-0 h-12">
          Apply
        </SubmitButton>
      </div>
    </Form>
  )
}

export default DiscountCode
