Structured Outputs is a feature that lets the API return responses in a specific, organized format, like JSON or other schemas you define. Instead of getting free-form text, you receive data that's consistent and easy to parse.

Ideal for tasks like document parsing, entity extraction, or report generation, it lets you define schemas using tools like Pydantic or Zod to enforce data types, constraints, and structure.

When using structured outputs, the LLM's response is guaranteed to match your input schema.
Supported models

Structured outputs is supported by all language models later than 
grok-2-1212
 and
grok-2-vision-1212
.

Supported schemas

For structured output, the following types are supported for structured output:

string
minLength
 and 
maxLength
 properties are not supported
number
integer
float
object
array
minItems
 and 
maxItem
 properties are not supported
maxContains
 and 
minContains
 properties are not supported
boolean
enum
anyOf
allOf
 is not supported at the moment.

Example: Invoice Parsing

A common use case for Structured Outputs is parsing raw documents. For example, invoices contain structured data like vendor details, amounts, and dates, but extracting this data from raw text can be error-prone. Structured Outputs ensure the extracted data matches a predefined schema.

Let's say you want to extract the following data from an invoice:

Vendor name and address
Invoice number and date
Line items (description, quantity, price)
Total amount and currency
We'll use structured outputs to have Grok generate a strongly-typed JSON for this.

Step 1: Defining the Schema

You can use Pydantic or Zod to define your schema.

Javascript

import { z } from "zod";
const CurrencyEnum = z.enum(["USD", "EUR", "GBP"]);
const LineItemSchema = z.object({
    description: z.string().describe("Description of the item or service"),
    quantity: z.number().int().min(1).describe("Number of units"),
    unit_price: z.number().min(0).describe("Price per unit"),
});
const AddressSchema = z.object({
    street: z.string().describe("Street address"),
    city: z.string().describe("City"),
    postal_code: z.string().describe("Postal/ZIP code"),
    country: z.string().describe("Country"),
});
const InvoiceSchema = z.object({
    vendor_name: z.string().describe("Name of the vendor"),
    vendor_address: AddressSchema.describe("Vendor's address"),
    invoice_number: z.string().describe("Unique invoice identifier"),
    invoice_date: z.string().date().describe("Date the invoice was issued"),
    line_items: z.array(LineItemSchema).describe("List of purchased items/services"),
    total_amount: z.number().min(0).describe("Total amount due"),
    currency: CurrencyEnum.describe("Currency of the invoice"),
});
Step 2: Prepare The Prompts

System Prompt

The system prompt instructs the model to extract invoice data from text. Since the schema is defined separately, the prompt can focus on the task without explicitly specifying the required fields in the output JSON.

Text

Given a raw invoice, carefully analyze the text and extract the relevant invoice data into JSON format.
Example Invoice Text

Text

Vendor: Acme Corp, 123 Main St, Springfield, IL 62704
Invoice Number: INV-2025-001
Date: 2025-02-10
Items:
- Widget A, 5 units, $10.00 each
- Widget B, 2 units, $15.00 each
Total: $80.00 USD
Step 3: The Final Code

Use the structured outputs feature of the the SDK to parse the invoice.


Python

Javascript
Other

import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import { z } from 'zod';
const CurrencyEnum = z.enum(['USD', 'EUR', 'GBP']);
const LineItemSchema = z.object({
  description: z.string().describe('Description of the item or service'),
  quantity: z.number().int().min(1).describe('Number of units'),
  unit_price: z.number().min(0).describe('Price per unit'),
});
const AddressSchema = z.object({
  street: z.string().describe('Street address'),
  city: z.string().describe('City'),
  postal_code: z.string().describe('Postal/ZIP code'),
  country: z.string().describe('Country'),
});
const InvoiceSchema = z.object({
  vendor_name: z.string().describe('Name of the vendor'),
  vendor_address: AddressSchema.describe("Vendor's address"),
  invoice_number: z.string().describe('Unique invoice identifier'),
  invoice_date: z.string().date().describe('Date the invoice was issued'),
  line_items: z
    .array(LineItemSchema)
    .describe('List of purchased items/services'),
  total_amount: z.number().min(0).describe('Total amount due'),
  currency: CurrencyEnum.describe('Currency of the invoice'),
});
const result = await generateObject({
  model: xai('grok-4'),
  schema: InvoiceSchema,
  system:
    'Given a raw invoice, carefully analyze the text and extract the invoice data into JSON format.',
  prompt: `
  Vendor: Acme Corp, 123 Main St, Springfield, IL 62704
  Invoice Number: INV-2025-001
  Date: 2025-02-10
  Items:
  - Widget A, 5 units, $10.00 each
  - Widget B, 2 units, $15.00 each
    Total: $80.00 USD
    `,
});
console.log(result.object);
Step 4: Type-safe Output

The output will always be type-safe and respect the input schema.

JSON

{
  "vendor_name": "Acme Corp",
  "vendor_address": {
    "street": "123 Main St",
    "city": "Springfield",
    "postal_code": "62704",
    "country": "IL"
  },
  "invoice_number": "INV-2025-001",
  "invoice_date": "2025-02-10",
  "line_items": [
    { "description": "Widget A", "quantity": 5, "unit_price": 10.0 },
    { "description": "Widget B", "quantity": 2, "unit_price": 15.0 }
  ],
  "total_amount": 80.0,
  "currency": "USD"
}
