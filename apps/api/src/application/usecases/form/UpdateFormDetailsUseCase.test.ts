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
  it('keeps onePage and descriptionAlign when the body omits them', async () => {
    const { form, useCase } = setup({ onePage: true, descriptionAlign: 'left' });
    const body = updateFormSchema.parse({ title: 'New' });

    await useCase.execute({ formId: 'form-1', accountId: 'account-1', ...body });

    expect(form).toMatchObject({ title: 'New', onePage: true, descriptionAlign: 'left' });
  });

  it('applies values that are sent explicitly and ignores the removed isAnonymous/isPublished flags', async () => {
    const { form, useCase } = setup({ onePage: true });
    const body = updateFormSchema.parse({ title: 'New', isPublished: false, isAnonymous: false, onePage: false, descriptionAlign: 'right' });

    await useCase.execute({ formId: 'form-1', accountId: 'account-1', ...body });

    expect(body).not.toHaveProperty('isPublished');
    expect(body).not.toHaveProperty('isAnonymous');
    expect(form).toMatchObject({ onePage: false, descriptionAlign: 'right' });
  });
});
