import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateEscuelaInput } from './create-escuela.input';
import { IsInt, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateEscuelaInput extends PartialType(CreateEscuelaInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_escuela: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activa?: boolean;
}
