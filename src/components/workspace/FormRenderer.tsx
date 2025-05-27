"use client";

import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { GeneratedFormFields, FormFieldDefinition, FormValues } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

interface FormRendererProps {
  formFields: GeneratedFormFields;
  control: Control<FormValues>; // Control from react-hook-form
  disabled?: boolean;
}

function normalizeFieldName(name: string): string {
  return name.replace(/\s+/g, '_').toLowerCase();
}

export function FormRenderer({ formFields, control, disabled }: FormRendererProps) {
  if (Object.keys(formFields).length === 0) {
    return <p className="text-muted-foreground">No form fields generated for this page.</p>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(formFields).map(([fieldName, fieldDef]) => {
        const normalizedName = normalizeFieldName(fieldName) as keyof FormValues;
        const label = fieldDef.label || fieldName;

        return (
          <FormField
            key={normalizedName}
            control={control}
            name={normalizedName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <>
                    {fieldDef.type === 'text' && (
                      <Input {...field} placeholder={`Enter ${label.toLowerCase()}`} disabled={disabled} />
                    )}
                    {fieldDef.type === 'multi-line text' && (
                      <Textarea {...field} placeholder={`Enter ${label.toLowerCase()}`} disabled={disabled} />
                    )}
                    {fieldDef.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={normalizedName}
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          disabled={disabled}
                        />
                        <Label htmlFor={normalizedName} className="font-normal">
                          {fieldDef.options && fieldDef.options.length > 0 ? fieldDef.options[0] : label}
                        </Label>
                      </div>
                    )}
                    {fieldDef.type === 'radio' && fieldDef.options && (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value as string}
                        className="flex flex-col space-y-1"
                        disabled={disabled}
                      >
                        {fieldDef.options.map((option) => (
                          <FormItem key={option} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={option} disabled={disabled} />
                            </FormControl>
                            <FormLabel className="font-normal">{option}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    )}
                    {fieldDef.type === 'dropdown' && fieldDef.options && (
                      <Select onValueChange={field.onChange} defaultValue={field.value as string} disabled={disabled}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldDef.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
    </div>
  );
}
