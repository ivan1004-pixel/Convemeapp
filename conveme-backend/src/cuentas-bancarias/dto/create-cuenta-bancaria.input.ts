import { InputType, Field, Int } from '@nestjs/graphql';
import {
    IsInt,
    IsString,
    IsNotEmpty,
    IsOptional,
} from 'class-validator';

@InputType()
export class CreateCuentaBancariaInput {
    @Field(() => Int)
    @IsInt()
    vendedor_id: number;

    @Field()
    @IsString()
    @IsNotEmpty()
    banco: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    titular_cuenta: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    numero_cuenta: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    clabe_interbancaria?: string;
}
