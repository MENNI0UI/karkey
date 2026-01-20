import { LuxuryLoader } from './luxury-loader'
import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <LuxuryLoader
      size="sm"
      className={cn('size-4', className)}
      {...props}
    />
  )
}

export { Spinner }
