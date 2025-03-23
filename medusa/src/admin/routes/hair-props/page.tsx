import * as React from 'react'
import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  Swatch,
  PencilSquare,
  EllipsisHorizontal,
  Trash,
  ArrowPath,
} from '@medusajs/icons'
import {
  Container,
  Heading,
  Table,
  Button,
  IconButton,
  Text,
  Drawer,
  DropdownMenu,
  Prompt,
  Switch,
  Label,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'

import { ProductLengthModelType } from '../../../modules/hair-props/models/product-length'
import { useCreateProductLengthMutation } from '../../hooks/hair-props'
import { Form } from '../../components/Form/Form'
import { InputField } from '../../components/Form/InputField'
import {
  EditProductLengthDrawer,
  productLengthFormSchema,
} from '../../components/EditProductLengthDrawer'
import { withQueryClient } from '../../components/QueryClientProvider'

const DeleteProductLengthPrompt: React.FC<{
  id: string
  name: string
  children: React.ReactNode
}> = ({ id, name, children }) => {
  const queryClient = useQueryClient()
  const [isPromptOpen, setIsPromptOpen] = React.useState(false)
  const deleteProductLengthMutation = useMutation({
    mutationKey: ['hair-props', id, 'delete'],
    mutationFn: async () => {
      return fetch(`/admin/hair-props/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then((res) => res.json())
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'hair-props',
      })

      setIsPromptOpen(false)
    },
  })

  return (
    <Prompt open={isPromptOpen} onOpenChange={setIsPromptOpen}>
      <Prompt.Trigger asChild>{children}</Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Delete {name} product length?</Prompt.Title>
          <Prompt.Description>
            Are you sure you want to delete the product length {name}?
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action
            onClick={() => {
              deleteProductLengthMutation.mutate()
            }}
          >
            Delete
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const RestoreProductLengthPrompt: React.FC<{
  id: string
  name: string
  children: React.ReactNode
}> = ({ id, name, children }) => {
  const queryClient = useQueryClient()
  const [isPromptOpen, setIsPromptOpen] = React.useState(false)
  const restoreProductLengthMutation = useMutation({
    mutationKey: ['hair-props', id, 'restore'],
    mutationFn: async () => {
      return fetch(`/admin/hair-props/${id}/restore`, {
        method: 'POST',
        credentials: 'include',
      }).then((res) => res.json())
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'hair-props',
      })

      setIsPromptOpen(false)
    },
  })

  return (
    <Prompt open={isPromptOpen} onOpenChange={setIsPromptOpen}>
      <Prompt.Trigger asChild>{children}</Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Restore {name} product length?</Prompt.Title>
          <Prompt.Description>
            Are you sure you want to restore the product length {name}?
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action
            onClick={() => {
              restoreProductLengthMutation.mutate()
            }}
          >
            Restore
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const ProductLengthsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const setPage = React.useCallback(
    (page: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', page.toString())
        return next
      })
    },
    [setSearchParams]
  )
  const deleted = searchParams.has('deleted')
  const toggleDeleted = React.useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (prev.has('page')) {
        next.delete('page')
      }

      if (!prev.has('deleted')) {
        next.set('deleted', '')
      } else {
        next.delete('deleted')
      }
      return next
    })
  }, [setSearchParams])
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: ['hair-props', deleted, page],
    queryFn: async () => {
      return fetch(
        `/admin/hair-props?page=${page}${deleted ? '&deleted=true' : ''}`,
        {
          credentials: 'include',
        }
      ).then(
        (res) =>
          res.json() as Promise<{
            product_lengths: ProductLengthModelType[]
            count: number
            page: number
            last_page: number
          }>
      )
    },
  })

  const createProductLengthMutation = useCreateProductLengthMutation()

  return (
    <Container className="px-0">
      <div className="flex flex-row items-center justify-between gap-6 px-6 mb-4">
        <Heading level="h2">Product Lengths</Heading>
        <div className="flex flex-row gap-4">
          <div className="flex items-center gap-x-2">
            <Switch
              id="deleted-flag"
              checked={deleted}
              onClick={() => {
                toggleDeleted()
              }}
            />
            <Label htmlFor="deleted-flag">Show Deleted</Label>
          </div>
          <Drawer open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <Drawer.Trigger asChild>
              <Button variant="secondary" size="small">
                Create
              </Button>
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Create Material</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Form
                  schema={productLengthFormSchema}
                  onSubmit={async (values) => {
                    await createProductLengthMutation.mutateAsync(values)
                    setIsCreateModalOpen(false)
                  }}
                  formProps={{
                    id: 'create-material-form',
                  }}
                >
                  <InputField name="name" label="Name" />
                </Form>
              </Drawer.Body>
              <Drawer.Footer>
                <Drawer.Close asChild>
                  <Button variant="secondary">Cancel</Button>
                </Drawer.Close>
                <Button
                  type="submit"
                  form="create-material-form"
                  isLoading={createProductLengthMutation.isPending}
                >
                  Create
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        </div>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>&nbsp;</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              {/* @ts-ignore */}
              <Table.Cell colSpan={2}>
                <Text>Loading...</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {isError && (
            <Table.Row>
              {/* @ts-ignore */}
              <Table.Cell colSpan={2}>
                <Text>Error loading materials</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {isSuccess && data.product_lengths.length === 0 && (
            <Table.Row>
              {/* @ts-ignore */}
              <Table.Cell colSpan={2}>
                <Text>No product lengths found</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {isSuccess &&
            data.product_lengths.length > 0 &&
            data.product_lengths.map((productLength) => (
              <Table.Row key={productLength.id}>
                <Table.Cell>
                  <Link to={`/hair-props/${productLength.id}`}>
                    {productLength.name}
                  </Link>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <IconButton>
                        <EllipsisHorizontal />
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item asChild>
                        <EditProductLengthDrawer
                          id={productLength.id}
                          initialValues={productLength}
                        >
                          <Button
                            variant="transparent"
                            className="flex flex-row items-center justify-start w-full gap-2"
                          >
                            <PencilSquare className="text-fg-subtle dark:text-fg-subtle-dark" />
                            Edit
                          </Button>
                        </EditProductLengthDrawer>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      {productLength.deleted_at ? (
                        <DropdownMenu.Item asChild>
                          <RestoreProductLengthPrompt
                            id={productLength.id}
                            name={productLength.name}
                          >
                            <Button
                              variant="transparent"
                              className="flex flex-row items-center justify-start w-full gap-2"
                            >
                              <ArrowPath className="text-fg-subtle dark:text-fg-subtle-dark" />
                              Restore
                            </Button>
                          </RestoreProductLengthPrompt>
                        </DropdownMenu.Item>
                      ) : (
                        <DropdownMenu.Item asChild>
                          <DeleteProductLengthPrompt
                            id={productLength.id}
                            name={productLength.name}
                          >
                            <Button
                              variant="transparent"
                              className="flex flex-row items-center justify-start w-full gap-2"
                            >
                              <Trash className="text-fg-subtle dark:text-fg-subtle-dark" />
                              Delete
                            </Button>
                          </DeleteProductLengthPrompt>
                        </DropdownMenu.Item>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
      <Table.Pagination
        className="pb-0"
        count={data?.count || 0}
        pageSize={20}
        pageIndex={page - 1}
        pageCount={data?.last_page ?? 1}
        canPreviousPage={page > 1}
        canNextPage={page < (data?.last_page ?? 1)}
        previousPage={() => setPage(Math.max(1, page - 1))}
        nextPage={() => setPage(Math.min(page + 1, data?.last_page ?? 1))}
      />
    </Container>
  )
}

export default withQueryClient(ProductLengthsPage)

export const config = defineRouteConfig({
  label: 'Product Lengths & Cap Sizes',
  icon: Swatch,
})
