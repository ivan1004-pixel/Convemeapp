import { InputType, Field, Float } from '@nestjs/graphql';
import {
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsNotEmpty,
} from 'class-validator';

@InputType()
export class CreatePromocionInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    tipo_promocion: string; // Ej: 'Porcentaje', 'Monto Fijo', 'NxM'

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    valor_descuento?: number;

    // Las recibimos como string desde el front (ej: "2026-04-10" o ISO),
    // y las convertimos a Date en el service.
    @Field()
    @IsString()
    @IsNotEmpty()
    fecha_inicio: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    fecha_fin: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activa?: boolean;
}
