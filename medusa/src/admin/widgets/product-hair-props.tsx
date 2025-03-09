import * as React from 'react'
import { defineWidgetConfig } from '@medusajs/admin-sdk'
import { DetailWidgetProps, AdminProduct } from '@medusajs/framework/types'
import {
  Container,
  Heading,
  Text,
  Button,
  Drawer,
  IconButton,
} from '@medusajs/ui'
import { ArrowPath, PlusMini } from '@medusajs/icons'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ProductLengthModelType } from '../../modules/hair-props/models/product-length'

import { Form } from '../components/Form/Form'
import { withQueryClient } from '../components/QueryClientProvider'
import {
  useCreateCapSizeMutation,
  useCreateProductLengthMutation,
} from '../hooks/hair-props'
import { InputField } from '../components/Form/InputField'

// const SelectColorField: React.FC<{
//   name: string;
// }> = ({ name }) => {
//   const materialsQuery = useInfiniteQuery({
//     queryKey: ['fashion'],
//     queryFn: async ({ pageParam = 1, signal }) => {
//       const res = await fetch(`/admin/fashion?page=${pageParam}`, {
//         credentials: 'include',
//         signal,
//       });

//       return res.json() as Promise<{
//         materials: MaterialModelType[];
//         count: number;
//         page: number;
//         last_page: number;
//       }>;
//     },
//     initialPageParam: 1,
//     getNextPageParam: (lastPage) => {
//       return lastPage.page < lastPage.last_page ? lastPage.page + 1 : undefined;
//     },
//     getPreviousPageParam: (firstPage) => {
//       return firstPage.page > 1 ? firstPage.page - 1 : undefined;
//     },
//   });

//   return (
//     <SelectField name={name}>
//       <Select.Trigger>
//         <Select.Value placeholder="Select color" />
//       </Select.Trigger>
//       <Select.Content>
//         {materialsQuery.isSuccess &&
//           materialsQuery.data.pages.map((materialsPageData) =>
//             materialsPageData.materials.map((material) => (
//               <Select.Group key={material.id}>
//                 <Select.Label>{material.name}</Select.Label>
//                 {material.colors.map((color) => (
//                   <Select.Item key={color.id} value={color.id}>
//                     {color.name}
//                   </Select.Item>
//                 ))}
//               </Select.Group>
//             )),
//           )}
//         {materialsQuery.isSuccess && materialsQuery.hasNextPage && (
//           <Select.Item
//             key={'load-more'}
//             value="load-more"
//             onClick={(event) => {
//               event.preventDefault();

//               if (materialsQuery.isFetchingNextPage) {
//                 return;
//               }

//               materialsQuery.fetchNextPage();
//             }}
//           >
//             {materialsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
//           </Select.Item>
//         )}
//       </Select.Content>
//     </SelectField>
//   );
// };

const addCapSizeFormSchema = z.object({
  name: z.string().min(1),
})

const AddCapSizeDrawer: React.FC<{
  productLengthId: string
  name: string
  children: React.ReactNode
}> = ({ productLengthId, name, children }) => {
  const queryClient = useQueryClient()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const createCapSizeMutation = useCreateCapSizeMutation(productLengthId, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.length >= 3 &&
          query.queryKey[0] === 'product' &&
          query.queryKey[2] === 'hair-props',
      })
      setIsDrawerOpen(false)
    },
  })

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Add new Cap Size</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <Form
            schema={addCapSizeFormSchema}
            onSubmit={async (values) => {
              createCapSizeMutation.mutate(values)
            }}
            defaultValues={{
              name,
            }}
            formProps={{
              id: `product-length-${productLengthId}-add-cap-size-${name
                .toLowerCase()
                .replace(/[^\w]/g, '-')}`,
            }}
          >
            <div className="flex flex-col gap-4">
              <fieldset disabled>
                <InputField name="name" label="Name" />
              </fieldset>
            </div>
          </Form>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            type="submit"
            form={`product-length-${productLengthId}-add-cap-size-${name
              .toLowerCase()
              .replace(/[^\w]/g, '-')}`}
            isLoading={createCapSizeMutation.isPending}
            disabled={createCapSizeMutation.isPending}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const ProductHairPropsWidget = withQueryClient(
  ({ data }: DetailWidgetProps<AdminProduct>) => {
    const productHairProps = useQuery({
      queryKey: ['product', data.id, 'hair-props'],
      queryFn: async ({ signal }) => {
        const res = await fetch(`/admin/products/${data.id}/hair-props`, {
          credentials: 'include',
          signal,
        })
        return res.json() as Promise<{
          missing_product_lengths: string[]
          product_lengths: (ProductLengthModelType & {
            missing_cap_sizes: string[]
          })[]
        }>
      },
    })
    const createProductLengthMutation = useCreateProductLengthMutation({
      onSuccess: () => {
        productHairProps.refetch()
      },
    })

    const productLengthsData = [
      ...(productHairProps.data?.missing_product_lengths ?? []),
      ...(productHairProps.data?.product_lengths ?? []),
    ].sort((a, b) => {
      const aName = typeof a === 'string' ? a : a.name
      const bName = typeof b === 'string' ? b : b.name

      return aName.localeCompare(bName)
    })

    return (
      <Container className="p-0 divide-y">
        <div className="flex flex-row items-center justify-between gap-6 px-6 py-4">
          <Heading>Product Lengths &amp; Cap Sizes</Heading>
          <IconButton
            variant="transparent"
            className="text-ui-fg-muted hover:text-ui-fg-subtle"
            onClick={(event) => {
              event.preventDefault()
              productHairProps.refetch()
            }}
            disabled={productHairProps.isFetching}
            isLoading={productHairProps.isFetching}
          >
            <ArrowPath />
          </IconButton>
        </div>
        <div className="px-6 py-4 text-ui-fg-subtle">
          {productHairProps.isLoading ? (
            <Text>Loading...</Text>
          ) : productHairProps.isError ? (
            <Text>Error loading product hair props</Text>
          ) : productHairProps.isSuccess &&
            productHairProps.data &&
            !productLengthsData.length ? (
            <Text>No product variants with Product Length option</Text>
          ) : productHairProps.isSuccess && productHairProps.data ? (
            <div className="flex flex-col gap-8">
              {productLengthsData.map((productLength) => (
                <div
                  key={
                    typeof productLength === 'string'
                      ? productLength
                      : productLength.id
                  }
                  className="flex flex-col gap-1"
                >
                  <Text>
                    <strong
                      className={
                        typeof productLength === 'string'
                          ? 'border-b border-dashed border-ui-button-danger'
                          : undefined
                      }
                    >
                      {typeof productLength === 'string'
                        ? productLength
                        : productLength.name}
                    </strong>
                  </Text>
                  {typeof productLength === 'string' ? (
                    <Button
                      variant="secondary"
                      onClick={(event) => {
                        event.preventDefault()
                        createProductLengthMutation.mutate({
                          name: productLength,
                        })
                      }}
                    >
                      Create product length
                    </Button>
                  ) : (
                    <div className="flex flex-row gap-4">
                      {productLength.capSizes.map((capSize) => (
                        <div
                          key={capSize.id}
                          className="flex flex-col items-center gap-1"
                        >
                          {/* <div
                            style={{ backgroundColor: capSize.hex_code }}
                            className="w-10 h-10 border-2 rounded-full border-grayscale-40"
                          /> */}
                          <Text>{capSize.name}</Text>
                        </div>
                      ))}
                      {productLength.missing_cap_sizes.map((capSize) => (
                        <div
                          key={capSize}
                          className="flex flex-col items-center gap-1"
                        >
                          <AddCapSizeDrawer
                            productLengthId={productLength.id}
                            name={capSize}
                          >
                            <IconButton
                              variant="transparent"
                              className="w-10 h-10 border-2 border-dashed rounded-full bg-grayscale-20 border-ui-button-danger"
                            >
                              <PlusMini />
                            </IconButton>
                          </AddCapSizeDrawer>
                          {/* <div className="w-10 h-10 border-2 border-dashed rounded-full bg-grayscale-20 border-ui-button-danger" /> */}
                          <Text>{capSize}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Text>No Hair dimension details set</Text>
          )}
        </div>
      </Container>
    )
  }
)

export const config = defineWidgetConfig({
  zone: 'product.details.side.before',
})

export default ProductHairPropsWidget
