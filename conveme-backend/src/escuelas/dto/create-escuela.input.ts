import { InputType, Int, Field } from '@nestjs/graphql';
import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateEscuelaInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    siglas?: string;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    municipio_id: number;
}
