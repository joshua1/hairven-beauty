"use client"

import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import ProductPrice from "../product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/Button"
import { NumberField } from "@/components/NumberField"
import { Popover, Radio, RadioGroup, Select } from "react-aria-components"
import {
  UiSelectButton,
  UiSelectIcon,
  UiSelectListBox,
  UiSelectListBoxItem,
  UiSelectValue,
} from "@/components/ui/Select"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  materials: {
    id: string
    name: string
    colors: {
      id: string
      name: string
      hex_code: string
    }[]
  }[]
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) {
      acc[varopt.option_id] = varopt.value
    }
    return acc
  }, {})
}

const priorityOptions = ["Material", "Color", "Size"]

export default function ProductActions({
  product,
  materials,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    setIsAdding(false)
  }

  const hasMultipleVariants = (product.variants?.length ?? 0) > 1
  const productOptions = (product.options || []).sort((a, b) => {
    let aPriority = priorityOptions.indexOf(a.title ?? "")
    let bPriority = priorityOptions.indexOf(b.title ?? "")

    if (aPriority === -1) {
      aPriority = priorityOptions.length
    }

    if (bPriority === -1) {
      bPriority = priorityOptions.length
    }

    return aPriority - bPriority
  })

  const materialOption = productOptions.find((o) => o.title === "Material")
  const colorOption = productOptions.find((o) => o.title === "Color")
  const otherOptions =
    materialOption && colorOption
      ? productOptions.filter(
          (o) => o.id !== materialOption.id && o.id !== colorOption.id
        )
      : productOptions

  const selectedMaterial =
    materialOption && options[materialOption.id]
      ? materials.find((m) => m.name === options[materialOption.id])
      : undefined

  const showOtherOptions =
    !materialOption ||
    !colorOption ||
    (selectedMaterial &&
      (selectedMaterial.colors.length < 2 || options[colorOption.id]))

  return (
    <>
      <ProductPrice product={product} variant={selectedVariant} />
      <div className="max-md:text-xs mb-8 md:mb-16 max-w-120">
        <p>{product.description}</p>
      </div>
      {hasMultipleVariants && (
        <div className="mb-10 md:mb-26">
          {materialOption && colorOption && (
            <>
              <p className="mb-4">
                Materials
                {options[materialOption.id] && (
                  <span className="text-grayscale-500 ml-6">
                    {options[materialOption.id]}
                  </span>
                )}
              </p>
              <Select
                selectedKey={options[materialOption.id]}
                onSelectionChange={(value) => {
                  setOptionValue(materialOption.id, `${value}`)
                }}
                placeholder="Choose material"
                className="w-full md:w-60 mb-8 md:mb-6"
                isDisabled={!!disabled || isAdding}
              >
                <UiSelectButton className="!h-12 px-4 gap-2 max-md:text-base">
                  <UiSelectValue />
                  <UiSelectIcon className="h-6 w-6" />
                </UiSelectButton>
                <Popover className="w-[--trigger-width]">
                  <UiSelectListBox>
                    {materials.map((material) => (
                      <UiSelectListBoxItem key={material.id} id={material.name}>
                        {material.name}
                      </UiSelectListBoxItem>
                    ))}
                  </UiSelectListBox>
                </Popover>
              </Select>
              {selectedMaterial && (
                <>
                  <p className="mb-4">
                    Colors
                    <span className="text-grayscale-500 ml-6">
                      {options[colorOption.id]}
                    </span>
                  </p>
                  <RadioGroup
                    value={options[colorOption.id]}
                    onChange={(value) => {
                      setOptionValue(colorOption.id, value)
                    }}
                    aria-label="Color"
                    className="flex gap-6"
                    isDisabled={!!disabled || isAdding}
                  >
                    {selectedMaterial.colors.map((color) => (
                      <Radio
                        key={color.id}
                        value={color.name}
                        aria-label={color.name}
                        className="h-8 w-8 cursor-pointer relative before:transition-colors before:absolute before:content-[''] before:-bottom-2 before:left-0 before:w-full before:h-px data-[selected]:before:bg-black shadow-sm hover:shadow"
                        style={{ background: color.hex_code }}
                      />
                    ))}
                  </RadioGroup>
                </>
              )}
            </>
          )}
          {showOtherOptions &&
            otherOptions.map((option) => {
              return (
                <>
                  <p className="mb-4">
                    {option.title}
                    {options[option.id] && (
                      <span className="text-grayscale-500 ml-6">
                        {options[option.id]}
                      </span>
                    )}
                  </p>
                  <Select
                    selectedKey={options[option.id]}
                    onSelectionChange={(value) => {
                      setOptionValue(option.id, `${value}`)
                    }}
                    placeholder={`Choose ${option.title.toLowerCase()}`}
                    className="w-full md:w-60 mb-8 md:mb-6"
                    isDisabled={!!disabled || isAdding}
                  >
                    <UiSelectButton className="!h-12 px-4 gap-2 max-md:text-base">
                      <UiSelectValue />
                      <UiSelectIcon className="h-6 w-6" />
                    </UiSelectButton>
                    <Popover className="w-[--trigger-width]">
                      <UiSelectListBox>
                        {(option.values ?? [])
                          .filter((value) => Boolean(value.value))
                          .map((value) => (
                            <UiSelectListBoxItem
                              key={value.id}
                              id={value.value}
                            >
                              {value.value}
                            </UiSelectListBoxItem>
                          ))}
                      </UiSelectListBox>
                    </Popover>
                  </Select>
                </>
              )
            })}
        </div>
      )}
      <div className="flex max-sm:flex-col gap-4 mb-4">
        <NumberField
          value={quantity}
          onChange={setQuantity}
          minValue={1}
          className="w-full sm:w-35 max-md:justify-center max-md:gap-2"
        />
        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding}
          isLoading={isAdding}
          className="sm:flex-1"
        >
          {!selectedVariant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : "Add to cart"}
        </Button>
      </div>
    </>
  )
}
