import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateCategoriaInput } from './create-categoria.input';
import { IsInt, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateCategoriaInput extends PartialType(CreateCategoriaInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_categoria: number;

    // Opcional para poder desactivar/reactivar
    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
