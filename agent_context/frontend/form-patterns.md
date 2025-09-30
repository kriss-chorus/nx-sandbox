# Form Patterns

## Overview

This guide covers form handling patterns using React Hook Form, MUI components, and GraphQL mutations.

> **Note**: The examples in this guide use `useFacilityStore` and `useFacilityStateUpdate` as placeholder names. In your actual implementation, you should create typed hooks using `createCommonStoreCreator` as shown in the state management documentation. For example:
> ```typescript
> const { useCommonStore: useFacilityStore, useStateUpdate: useFacilityStateUpdate } = 
>   createCommonStoreCreator<FacilityModel>();
> ```

This project uses **React Hook Form** for form management. It provides performant forms with easy validation and minimal re-renders.

## Basic Form Setup

### Simple Form Example

```tsx
import { useForm } from 'react-hook-form';
import { TextField } from '@platform/signature-component-library';
import { Button, Grid2 } from '@mui/material';

interface FormData {
  name: string;
  email: string;
  phone: string;
}

export const ContactForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await saveContact(data);
      notifications.show('Contact saved successfully', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      reset();
    } catch (error) {
      notifications.show('Failed to save contact', {
        severity: 'error',
        autoHideDuration: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid2 container spacing={2}>
        <Grid2 size={12}>
          <TextField
            label="Name"
            {...register('name', {
              required: 'Name is required',
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />
        </Grid2>

        <Grid2 size={12}>
          <TextField
            label="Email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
        </Grid2>

        <Grid2 size={12}>
          <PhoneNumberTextField
            label="Phone"
            {...register('phone', {
              required: 'Phone is required',
            })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
          />
        </Grid2>

        <Grid2 size={12}>
          <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Saving...' : 'Save Contact'}
          </Button>
        </Grid2>
      </Grid2>
    </form>
  );
};
```

## Validation Patterns

### Built-in Validations

```tsx
const { register } = useForm();

// Required field
<TextField
  {...register('username', {
    required: 'Username is required'
  })}
/>

// Min/Max length
<TextField
  {...register('password', {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    maxLength: {
      value: 20,
      message: 'Password cannot exceed 20 characters',
    },
  })}
/>

// Pattern matching
<TextField
  {...register('zipCode', {
    pattern: {
      value: /^\d{5}(-\d{4})?$/,
      message: 'Invalid ZIP code format',
    },
  })}
/>

// Number validations
<TextField
  type="number"
  {...register('age', {
    min: {
      value: 18,
      message: 'Must be at least 18 years old',
    },
    max: {
      value: 100,
      message: 'Invalid age',
    },
  })}
/>
```

### Custom Validation

```tsx
// Custom validation function
<TextField
  {...register('confirmPassword', {
    validate: (value) =>
      value === password || 'Passwords do not match',
  })}
/>

// Multiple custom validations
<TextField
  {...register('username', {
    validate: {
      noSpaces: (value) =>
        !value.includes(' ') || 'Username cannot contain spaces',
      notReserved: async (value) => {
        const isAvailable = await checkUsernameAvailability(value);
        return isAvailable || 'Username is already taken';
      },
    },
  })}
/>
```

## Controlled Components

### Using Controller

```tsx
import { Controller } from 'react-hook-form';
import { Select } from '@platform/signature-component-library';

export const ControlledForm = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      country: '',
      acceptTerms: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller name="country" control={control} rules={{ required: 'Please select a country' }} render={({ field, fieldState: { error } }) => <Select {...field} label="Country" options={countryOptions} error={!!error} helperText={error?.message} />} />

      <Controller
        name="acceptTerms"
        control={control}
        rules={{
          required: 'You must accept the terms and conditions',
        }}
        render={({ field: { value, onChange }, fieldState: { error } }) => <FormControlLabel control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />} label="I accept the terms and conditions" />}
      />
    </form>
  );
};
```

## Complex Form Patterns

### Dynamic Form Arrays

```tsx
import { useFieldArray } from 'react-hook-form';

interface FormData {
  contacts: {
    name: string;
    email: string;
  }[];
}

export const DynamicContactsForm = () => {
  const { control, register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      contacts: [{ name: '', email: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <Grid2 container spacing={2} key={field.id}>
          <Grid2 size={5}>
            <TextField
              label="Name"
              {...register(`contacts.${index}.name`, {
                required: 'Name is required',
              })}
              fullWidth
            />
          </Grid2>

          <Grid2 size={5}>
            <TextField
              label="Email"
              {...register(`contacts.${index}.email`, {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email',
                },
              })}
              fullWidth
            />
          </Grid2>

          <Grid2 size={2}>
            <IconButton onClick={() => remove(index)} disabled={fields.length === 1}>
              <FontAwesomeIcon icon={faTrash} />
            </IconButton>
          </Grid2>
        </Grid2>
      ))}

      <Button startIcon={<FontAwesomeIcon icon={faPlus} />} onClick={() => append({ name: '', email: '' })}>
        Add Contact
      </Button>
    </form>
  );
};
```

### Conditional Fields

```tsx
export const ConditionalForm = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm();

  const hasCompany = watch('hasCompany', false);
  const country = watch('country');

  return (
    <form>
      <FormControlLabel control={<Checkbox {...register('hasCompany')} />} label="I represent a company" />

      {hasCompany && (
        <TextField
          label="Company Name"
          {...register('companyName', {
            required: hasCompany ? 'Company name is required' : false,
          })}
          error={!!errors.companyName}
          helperText={errors.companyName?.message}
        />
      )}

      <Select label="Country" {...register('country')} options={countryOptions} />

      {country === 'US' && (
        <TextField
          label="State"
          {...register('state', {
            required: country === 'US' ? 'State is required' : false,
          })}
        />
      )}
    </form>
  );
};
```

## Form State Management

### Integration with Store

```tsx
export const EditFacilityForm = ({ facilityId }: { facilityId: string }) => {
  const facility = useFacilityStore((s) => s.facilities.find((f) => f.id === facilityId));
  const updateState = useFacilityStateUpdate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      name: facility?.name || '',
      description: facility?.description || '',
      capacity: facility?.capacity || 0,
    },
  });

  // Reset form when facility changes
  useEffect(() => {
    if (facility) {
      reset({
        name: facility.name,
        description: facility.description,
        capacity: facility.capacity,
      });
    }
  }, [facility, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateFacility({ id: facilityId, ...data });

      updateState((draft) => {
        const index = draft.facilities.findIndex((f) => f.id === facilityId);
        if (index !== -1) {
          draft.facilities[index] = { ...draft.facilities[index], ...data };
        }
      });

      notifications.show('Facility updated', {
        severity: 'success',
        autoHideDuration: 3000,
      });
    } catch (error) {
      notifications.show('Update failed', {
        severity: 'error',
        autoHideDuration: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit" variant="contained" disabled={!isDirty}>
        Save Changes
      </Button>
    </form>
  );
};
```

## Error Handling

### Field-Level Errors

```tsx
const styles = {
  errorText: css({
    color: 'rgba(244, 67, 54, 1)',
    fontSize: '0.75rem',
    marginTop: 'var(--mui-spacing-0.5)',
  }),
};

export const FieldWithError = () => {
  const {
    register,
    formState: { errors },
  } = useForm();

  return (
    <div>
      <TextField
        label="Email"
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Please enter a valid email address',
          },
        })}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
    </div>
  );
};
```

### Form-Level Errors

```tsx
export const FormWithGlobalError = () => {
  const [globalError, setGlobalError] = useState<string | undefined>();

  const onSubmit = async (data: FormData) => {
    setGlobalError(undefined);

    try {
      await submitForm(data);
    } catch (error) {
      if (error.response?.data?.message) {
        setGlobalError(error.response.data.message);
      } else {
        setGlobalError('An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {globalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalError}
        </Alert>
      )}

      {/* Form fields */}
    </form>
  );
};
```

## Performance Optimization

### Debounced Validation

```tsx
import { debounce } from 'lodash';

export const DebouncedValidationForm = () => {
  const checkEmailAvailability = useMemo(
    () =>
      debounce(async (email: string) => {
        const response = await api.checkEmail(email);
        return response.available;
      }, 500),
    [],
  );

  return (
    <TextField
      {...register('email', {
        validate: async (value) => {
          if (!value) return 'Email is required';

          const isValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
          if (!isValid) return 'Invalid email format';

          const isAvailable = await checkEmailAvailability(value);
          return isAvailable || 'Email is already registered';
        },
      })}
    />
  );
};
```

### Optimized Re-renders

```tsx
// Use formState destructuring carefully
export const OptimizedForm = () => {
  // ✅ Good - Only subscribes to needed state
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm();

  // ❌ Bad - Subscribes to entire formState
  const { register, handleSubmit, formState } = useForm();
};
```

## Testing Forms

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ContactForm', () => {
  it('should display validation errors', async () => {
    render(<ContactForm />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should submit valid form', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Phone'), '555-1234');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith('Contact saved successfully', expect.any(Object));
    });
  });
});
```

## Best Practices

1. **Use React Hook Form for all forms** - Don't use uncontrolled components
2. **Provide clear validation messages** - Help users fix errors
3. **Show loading states** - Disable submit during async operations
4. **Handle errors gracefully** - Show user-friendly error messages
5. **Reset forms after successful submission** - Clear the data
6. **Use proper input types** - email, tel, number, etc.
7. **Validate on blur for better UX** - Not just on submit
8. **Debounce expensive validations** - Like API calls
9. **Test form validation** - Ensure all paths work
10. **Use TypeScript** - Type your form data interfaces
