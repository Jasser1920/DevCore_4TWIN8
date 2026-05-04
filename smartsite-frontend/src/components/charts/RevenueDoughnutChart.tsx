import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ['Direct', 'Social', 'Referral'],
  datasets: [
    {
      label: 'Revenue',
      data: [55, 30, 15],
      backgroundColor: [
        '#4e73df',
        '#1cc88a',
        '#36b9cc',
      ],
      borderWidth: 1,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false,
    },
  },
};

export default function RevenueDoughnutChart() {
  return <Doughnut data={data} options={options} />;
}
