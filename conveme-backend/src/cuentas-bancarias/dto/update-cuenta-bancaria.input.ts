import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateCuentaBancariaInput } from './create-cuenta-bancaria.input';
import { IsInt, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateCuentaBancariaInput extends PartialType(CreateCuentaBancariaInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_cuenta: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activa?: boolean;
}
