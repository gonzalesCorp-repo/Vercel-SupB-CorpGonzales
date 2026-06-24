import { redirect } from 'next/navigation';

export default function Home() {
  // Por defecto, redirigimos a login o al módulo principal
  redirect('/login');
}
