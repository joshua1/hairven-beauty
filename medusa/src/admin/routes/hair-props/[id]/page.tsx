import * as React from 'react'
import { z } from 'zod'
import { useParams } from 'react-router-dom'
import {
  Container,
  Heading,
  Text,
  IconButton,
  Table,
  Button,
  Drawer,
  DropdownMenu,
  Prompt,
  Switch,
  Label,
  Kbd,
} from '@medusajs/ui'
import {
  PencilSquare,
  EllipsisHorizontal,
  Trash,
  ArrowPath,
} from '@medusajs/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import type { ProductLengthModelType } from '../../../../modules/hair-props/models/product-length'
import { CapSizeModelType } from '../../../../modules/hair-props/models/cap-size'
import { useCreateCapSizeMutation } from '../../../hooks/hair-props'
import { Form } from '../../../components/Form/Form'
import { InputField } from '../../../components/Form/InputField'
import { EditProductLengthDrawer } from '../../../components/EditProductLengthDrawer'
import { withQueryClient } from '../../../components/QueryClientProvider'

const colorFormSchema = z.object({
  name: z.string().min(1),
  hex_code: z.string().min(7).max(7),
})

const EditCapSizeDrawer: React.FC<{
  productLengthId: string
  id: string
  initialValues: z.infer<typeof colorFormSchema>
  children: React.ReactNode
}> = ({ productLengthId, id, initialValues, children }) => {
  const queryClient = useQueryClient()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const updateCapSizeMutation = useMutation({
    mutationKey: ['hair-props', productLengthId, 'cap-sizes', id, 'update'],
    mutationFn: async (values: z.infer<typeof colorFormSchema>) => {
      return fetch(`/admin/hair-props/${productLengthId}/cap-sizes/${id}`, {
        method: 'POST',
        body: JSON.stringify(values),
        credentials: 'include',
      }).then((res) => res.json())
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'hair-props',
      })
    },
  })

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Edit Cap Size</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Form
            schema={colorFormSchema}
            onSubmit={async (values) => {
              await updateCapSizeMutation.mutateAsync(values)
              setIsDrawerOpen(false)
            }}
            formProps={{
              id: `edit-cap-size-${id}-form`,
            }}
            defaultValues={initialValues}
          >
            <div className="flex flex-col gap-4">
              <InputField name="name" label="Name" />
              <InputField
                name="hex_code"
                label="Hex Code"
                type="color"
                inputProps={{
                  className: 'max-w-8',
                }}
              />
            </div>
          </Form>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            type="submit"
            form={`edit-cap-size-${id}-form`}
            isLoading={updateCapSizeMutation.isPending}
          >
            Update
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const DeleteCapSizePrompt: React.FC<{
  productLengthId: string
  id: string
  name: string
  children: React.ReactNode
}> = ({ productLengthId, name, id, children }) => {
  const queryClient = useQueryClient()
  const [isPromptOpen, setIsPromptOpen] = React.useState(false)
  const deleteCapSizeMutation = useMutation({
    mutationKey: ['hair-props', productLengthId, 'cap-sizes', id, 'delete'],
    mutationFn: async () => {
      return fetch(`/admin/hair-props/${productLengthId}/cap-sizes/${id}`, {
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
          <Prompt.Title>Delete {name} cap size?</Prompt.Title>
          <Prompt.Description>
            Are you sure you want to delete the cap size {name}?
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action
            onClick={() => {
              deleteCapSizeMutation.mutate()
            }}
          >
            Delete
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const RestoreCapSizePrompt: React.FC<{
  productLengthId: string
  id: string
  name: string
  children: React.ReactNode
}> = ({ productLengthId, name, id, children }) => {
  const queryClient = useQueryClient()
  const [isPromptOpen, setIsPromptOpen] = React.useState(false)
  const restoreCapSizeMutation = useMutation({
    mutationKey: ['hair-props', productLengthId, 'cap-sizes', id, 'restore'],
    mutationFn: async () => {
      return fetch(
        `/admin/hair-props/${productLengthId}/cap-sizes/${id}/restore`,
        {
          method: 'POST',
          credentials: 'include',
        }
      ).then((res) => res.json())
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'hair-props',
      })

      setIsPromptOpen(false)
    },
  })

  return (
    <Prompt
      open={isPromptOpen}
      onOpenChange={setIsPromptOpen}
      variant="confirmation"
    >
      <Prompt.Trigger asChild>{children}</Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Restore {name} cap size?</Prompt.Title>
          <Prompt.Description>
            Are you sure you want to restore the cap size {name}?
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action
            onClick={() => {
              restoreCapSizeMutation.mutate()
            }}
          >
            Restore
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const ProductLengthCapSizes: React.FC<{ productLengthId: string }> = ({
  productLengthId,
}) => {
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
    queryKey: ['hair-props', productLengthId, 'cap-sizes', deleted, page],
    queryFn: async () => {
      return fetch(
        `/admin/hair-props/${productLengthId}/cap-sizes?page=${page}${
          deleted ? '&deleted=true' : ''
        }`,
        {
          credentials: 'include',
        }
      ).then(
        (res) =>
          res.json() as Promise<{
            cap_sizes: CapSizeModelType[]
            count: number
            page: number
            last_page: number
          }>
      )
    },
  })

  const createCapSizeMutation = useCreateCapSizeMutation(productLengthId)

  return (
    <div className="-px-6">
      <div className="flex flex-row items-center justify-between gap-6 px-6 mb-4">
        <Heading level="h2">Cap Sizes</Heading>
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
                <Drawer.Title>Create Color</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Form
                  schema={colorFormSchema}
                  onSubmit={async (values) => {
                    await createCapSizeMutation.mutateAsync(values)
                    setIsCreateModalOpen(false)
                  }}
                  formProps={{
                    id: 'create-cap-size-form',
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <InputField name="name" label="Name" />
                    <InputField
                      name="hex_code"
                      label="Hex Code"
                      type="color"
                      inputProps={{
                        className: 'max-w-8',
                      }}
                    />
                  </div>
                </Form>
              </Drawer.Body>
              <Drawer.Footer>
                <Drawer.Close asChild>
                  <Button variant="secondary">Cancel</Button>
                </Drawer.Close>
                <Button
                  type="submit"
                  form="create-cap-size-form"
                  isLoading={createCapSizeMutation.isPending}
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
            <Table.HeaderCell>Hex Code</Table.HeaderCell>
            <Table.HeaderCell>&nbsp;</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              {/* @ts-ignore */}
              <Table.Cell colSpan={3}>
                <Text>Loading...</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {isError && (
            <Table.Row>
              {/* @ts-ignore */}
              <Table.Cell colSpan={3}>
                <Text>Error loading colors</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {isSuccess && data.cap_sizes.length === 0 && (
            <Table.Row>
              {/* @ts-ignore */}
              <Table.Cell colSpan={3}>
                <Text>No cap sizes found</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {isSuccess &&
            data.cap_sizes.length > 0 &&
            data.cap_sizes.map((cap_size) => (
              <Table.Row key={cap_size.id}>
                <Table.Cell>{cap_size.name}</Table.Cell>
                <Table.Cell>
                  <Kbd className="flex flex-row items-center gap-1 font-mono">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `${cap_size.hex_code}` }}
                    />
                    {cap_size.hex_code}
                  </Kbd>
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
                        <EditCapSizeDrawer
                          productLengthId={productLengthId}
                          id={cap_size.id}
                          initialValues={cap_size}
                        >
                          <Button
                            variant="transparent"
                            className="flex flex-row items-center justify-start w-full gap-2"
                          >
                            <PencilSquare className="text-ui-fg-subtle" />
                            Edit
                          </Button>
                        </EditCapSizeDrawer>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      {cap_size.deleted_at ? (
                        <DropdownMenu.Item asChild>
                          <RestoreCapSizePrompt
                            productLengthId={productLengthId}
                            id={cap_size.id}
                            name={cap_size.name}
                          >
                            <Button
                              variant="transparent"
                              className="flex flex-row items-center justify-start w-full gap-2"
                            >
                              <ArrowPath className="text-ui-fg-subtle" />
                              Restore
                            </Button>
                          </RestoreCapSizePrompt>
                        </DropdownMenu.Item>
                      ) : (
                        <DropdownMenu.Item asChild>
                          <DeleteCapSizePrompt
                            productLengthId={productLengthId}
                            id={cap_size.id}
                            name={cap_size.name}
                          >
                            <Button
                              variant="transparent"
                              className="flex flex-row items-center justify-start w-full gap-2"
                            >
                              <Trash className="text-ui-fg-subtle" />
                              Delete
                            </Button>
                          </DeleteCapSizePrompt>
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
    </div>
  )
}

const MaterialPage = () => {
  const { id } = useParams()
  const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: ['hair-props', id],
    queryFn: async () => {
      const res = await fetch(`/admin/hair-props/${id}`, {
        credentials: 'include',
      })
      return res.json() as Promise<ProductLengthModelType>
    },
  })

  if (!id) {
    return null
  }

  return (
    <Container className="px-0">
      {isLoading && <Text>Loading...</Text>}
      {isError && <Text>Error loading material</Text>}
      {isSuccess && (
        <>
          <div className="flex flex-row items-center justify-between gap-6 px-6 mb-4">
            <div className="flex flex-row gap-3">
              <Heading level="h2">{data?.name}</Heading>
              <EditProductLengthDrawer id={id} initialValues={data}>
                <IconButton size="xsmall" variant="transparent">
                  <PencilSquare />
                </IconButton>
              </EditProductLengthDrawer>
            </div>
          </div>
        </>
      )}
      <hr className="mb-6" />
      <ProductLengthCapSizes productLengthId={id} />
    </Container>
  )
}

export default withQueryClient(MaterialPage)
