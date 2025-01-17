import * as React from "react"
import { listRegions } from "@lib/data/regions"
import { Layout, LayoutColumn } from "@/components/Layout"
import { LocalizedButtonLink, LocalizedLink } from "@/components/LocalizedLink"
import { CartIcon } from "./CartIcon"
import { HeaderDrawer } from "./HeaderDrawer"
import { RegionSwitcher } from "./RegionSwitcher"
import { HeaderWrapper } from "./HeaderWrapper"
import { Icon } from "./Icon"

export const Header: React.FC = async () => {
  const regions = await listRegions()

  const countryOptions = regions
    .map((r) => {
      return (r.countries ?? []).map((c) => ({
        country: c.iso_2,
        region: r.id,
        label: c.display_name,
      }))
    })
    .flat()
    .sort((a, b) => (a?.label ?? "").localeCompare(b?.label ?? ""))

  return (
    <>
      <HeaderWrapper>
        <Layout>
          <LayoutColumn>
            <div className="flex justify-between items-center h-18 md:h-21">
              <h1 className="font-medium text-md">
                <LocalizedLink href="/">SofaSocietyCo.</LocalizedLink>
              </h1>
              <div className="flex items-center gap-8 max-md:hidden">
                <LocalizedLink href="/about">About</LocalizedLink>
                <LocalizedLink href="/inspiration">Inspiration</LocalizedLink>
                <LocalizedLink href="/store">Shop</LocalizedLink>
              </div>
              <div className="flex items-center gap-3 lg:gap-6 max-md:hidden">
                <RegionSwitcher
                  countryOptions={countryOptions}
                  className="w-16"
                  selectButtonClassName="h-auto !gap-0 !p-1 transition-none"
                  selectIconClassName="text-current"
                />
                {/* <LocalizedButtonLink
                  variant="ghost"
                  className="p-1 group-data-[light=true]:md:text-white group-data-[sticky=true]:md:text-black"
                >
                  <Icon name="search" className="w-5 h-5" />
                </LocalizedButtonLink> */}
                <LocalizedButtonLink
                  href="/auth/login"
                  variant="ghost"
                  className="p-1 group-data-[light=true]:md:text-white group-data-[sticky=true]:md:text-black"
                >
                  <Icon name="user" className="w-6 h-6" />
                </LocalizedButtonLink>

                <LocalizedButtonLink
                  href="/cart"
                  variant="ghost"
                  className="p-1 group-data-[light=true]:md:text-white group-data-[sticky=true]:md:text-black"
                >
                  <CartIcon className="w-6 h-6" />
                </LocalizedButtonLink>
              </div>
              <div className="flex items-center gap-4 md:hidden">
                <LocalizedButtonLink
                  href="/auth/login"
                  variant="ghost"
                  className="p-1 group-data-[light=true]:md:text-white"
                >
                  <Icon
                    name="user"
                    className="w-6 h-6"
                    wrapperClassName="w-6 h-6"
                  />
                </LocalizedButtonLink>

                <LocalizedButtonLink
                  href="/cart"
                  variant="ghost"
                  className="p-1 group-data-[light=true]:md:text-white"
                >
                  <CartIcon className="w-6 h-6" wrapperClassName="w-6 h-6" />
                </LocalizedButtonLink>
                <HeaderDrawer countryOptions={countryOptions} />
              </div>
            </div>
          </LayoutColumn>
        </Layout>
      </HeaderWrapper>
    </>
  )
}
