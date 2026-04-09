import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateTamanoInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    descripcion: string;
}
