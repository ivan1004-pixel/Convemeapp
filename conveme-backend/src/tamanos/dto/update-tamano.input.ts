import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateTamanoInput } from './create-tamano.input';
import { IsInt, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateTamanoInput extends PartialType(CreateTamanoInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_tamano: number;

    // Opcional para poder desactivar (soft delete)
    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
