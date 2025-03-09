import * as React from 'react'
import { z } from 'zod'
import { Button, Drawer } from '@medusajs/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form } from './Form/Form'
import { InputField } from './Form/InputField'

export const productLengthFormSchema = z.object({
  name: z.string(),
})

export const EditProductLengthDrawer: React.FC<{
  id: string
  initialValues: z.infer<typeof productLengthFormSchema>
  children: React.ReactNode
}> = ({ id, initialValues, children }) => {
  const queryClient = useQueryClient()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const updateProductLengthMutation = useMutation({
    mutationKey: ['hair-props', 'update-product-length'],
    mutationFn: async (values: z.infer<typeof productLengthFormSchema>) => {
      return fetch(`/admin/hair-props/${id}`, {
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
          <Drawer.Title>Edit Product Length</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Form
            schema={productLengthFormSchema}
            onSubmit={async (values) => {
              await updateProductLengthMutation.mutateAsync(values)
              setIsDrawerOpen(false)
            }}
            formProps={{
              id: `edit-product-length-${id}-form`,
            }}
            defaultValues={initialValues}
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
            form={`edit-product-length-${id}-form`}
            isLoading={updateProductLengthMutation.isPending}
          >
            Update
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
