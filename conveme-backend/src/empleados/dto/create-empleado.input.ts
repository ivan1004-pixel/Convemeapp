import { InputType, Int, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsEmail, IsNotEmpty } from 'class-validator'; // 🟢 IMPORTANTE

@InputType()
export class CreateEmpleadoInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    usuario_id: number;

    @Field()
    @IsString()
    @IsNotEmpty()
    nombre_completo: string;

    @Field()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    telefono?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    puesto?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    calle_y_numero?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    colonia?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    codigo_postal?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    municipio_id?: number;
}
