"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import * as ReactAria from "react-aria-components"
import {
  UiSelectButton,
  UiSelectIcon,
  UiSelectListBox,
  UiSelectListBoxItem,
  UiSelectValue,
} from "@/components/ui/Select"
import { updateRegion } from "@lib/data/cart"
import { useCountryCode } from "hooks/country-code"

export const RegionSwitcher: React.FC<{
  countryOptions: {
    country: string | undefined
    region: string
    label: string | undefined
  }[]
  className?: string
  selectButtonClassName?: string
  selectIconClassName?: string
}> = ({
  countryOptions,
  className,
  selectButtonClassName,
  selectIconClassName,
}) => {
  const pathName = usePathname()
  const countryCode = useCountryCode(countryOptions)
  let currentPath = pathName

  if (countryCode) {
    currentPath = pathName.split(`/${countryCode}`)[1]
  }

  return (
    <ReactAria.Select
      selectedKey={`${countryCode}`}
      onSelectionChange={(key) => {
        updateRegion(`${key}`, currentPath)
      }}
      className={className}
      aria-label="Select country"
    >
      <UiSelectButton variant="ghost" className={selectButtonClassName}>
        <UiSelectValue>
          {(item) =>
            typeof item.selectedItem === "object" &&
            item.selectedItem !== null &&
            "country" in item.selectedItem &&
            typeof item.selectedItem.country === "string"
              ? item.selectedItem.country.toUpperCase()
              : item.defaultChildren
          }
        </UiSelectValue>
        <UiSelectIcon className={selectIconClassName} />
      </UiSelectButton>
      <ReactAria.Popover placement="bottom right" className="max-w-61 w-full">
        <UiSelectListBox>
          {countryOptions.map((country) => (
            <UiSelectListBoxItem
              key={country.country}
              id={country.country}
              value={country}
            >
              {country.label}
            </UiSelectListBoxItem>
          ))}
        </UiSelectListBox>
      </ReactAria.Popover>
    </ReactAria.Select>
  )
}
