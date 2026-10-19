import { Form } from '@monorepo/shared/entities/Form';
import { describe, expect, it, vi } from 'vitest';

import { updateFormSchema } from '@application/controllers/form/schemas/updateFormSchema';
import type { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';

import { UpdateFormDetailsUseCase } from './UpdateFormDetailsUseCase';

function setup(attrs: Partial<Form.Attributes>) {
  const form = new Form({ accountId: 'account-1', title: 'Old', ...attrs } as Form.Attributes);
  const formRepository = {
    findById: vi.fn().mockResolvedValue(form),
    update: vi.fn().mockResolvedValue(undefined),
  } as unknown as FormRepository;

  return { form, useCase: new UpdateFormDetailsUseCase(formRepository) };
}

describe('UpdateFormDetailsUseCase', () => {
  it('keeps the current flags when the body omits them (no republish of an unpublished form)', async () => {
    const { form, useCase } = setup({ isPublished: false, isAnonymous: false, onePage: true });
    const body = updateFormSchema.parse({ title: 'New' });

    await useCase.execute({ formId: 'form-1', accountId: 'account-1', ...body });

    expect(form).toMatchObject({ title: 'New', isPublished: false, isAnonymous: false, onePage: true });
  });

  it('applies flags that are sent explicitly', async () => {
    const { form, useCase } = setup({ isPublished: false, isAnonymous: false, onePage: true });
    const body = updateFormSchema.parse({ title: 'New', isPublished: true, isAnonymous: true, onePage: false });

    await useCase.execute({ formId: 'form-1', accountId: 'account-1', ...body });

    expect(form).toMatchObject({ isPublished: true, isAnonymous: true, onePage: false });
  });
});
