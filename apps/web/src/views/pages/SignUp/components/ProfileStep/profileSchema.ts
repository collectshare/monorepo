import z from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  birthDate: z
    .date({
      required_error: 'Data de nascimento é obrigatória',
      invalid_type_error: 'Data de nascimento deve ser uma data válida',
    })
    .max(new Date(), { message: 'Data de nascimento não pode ser uma data futura' })
    .refine(
      (date) => {
        const today = new Date();
        const eighteenYearsAgo = new Date(
          today.getFullYear() - 18,
          today.getMonth(),
          today.getDate(),
        );
        return date <= eighteenYearsAgo;
      },
      { message: 'Você precisa ter no mínimo 18 anos para se cadastrar.' },
    ),
});
