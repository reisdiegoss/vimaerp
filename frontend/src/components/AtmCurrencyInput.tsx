import React from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Componente de entrada monetária estilo "caixa eletrônico" (ATM).
 * Digitação da direita para a esquerda.
 */
export const AtmCurrencyInput: React.FC<Props> = ({ value, onChange, className, disabled }) => {
  const display = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value || 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não for dígito
    const rawDigits = e.target.value.replace(/\D/g, '');
    
    if (!rawDigits || rawDigits === '000') {
      onChange(0);
      return;
    }
    
    // Converte para centavos (float)
    const asFloat = parseInt(rawDigits, 10) / 100;
    onChange(asFloat);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      autoComplete="off"
    />
  );
};
