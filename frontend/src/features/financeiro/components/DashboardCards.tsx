import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

interface DashboardCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldoProjetado: number;
  totalAtrasado: number;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  // Converte centavos (Integer) para Decimal e formata
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
};

export const DashboardCards = ({
  totalReceitas,
  totalDespesas,
  saldoProjetado,
  totalAtrasado,
  isLoading
}: DashboardCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl border border-gray-200 dark:border-gray-700"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Receitas */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={24} />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total a Receber</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {formatCurrency(totalReceitas)}
        </h3>
      </div>

      {/* Despesas */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
            <TrendingDown size={24} />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total a Pagar</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {formatCurrency(totalDespesas)}
        </h3>
      </div>

      {/* Saldo Projetado */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Wallet size={24} />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Projetado</p>
        <h3 className={`text-2xl font-bold mt-1 ${saldoProjetado >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
          {formatCurrency(saldoProjetado)}
        </h3>
      </div>

      {/* Atrasados */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertCircle size={24} />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vencido</p>
        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {formatCurrency(totalAtrasado)}
        </h3>
      </div>
    </div>
  );
};
