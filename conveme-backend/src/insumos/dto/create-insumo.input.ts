import { InputType, Field, Float } from '@nestjs/graphql';
import {
    IsString,
    IsOptional,
    IsNumber,
    IsNotEmpty,
} from 'class-validator';

@InputType()
export class CreateInsumoInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    unidad_medida?: string;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    stock_minimo_alerta?: number;
}
