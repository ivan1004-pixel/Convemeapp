import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateCategoriaInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    nombre: string;
}
