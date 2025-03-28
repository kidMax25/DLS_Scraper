import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Wallet } from "lucide-react"

interface BalanceCardProps {
  balance: {
    amount: number
    earnings: number
  }
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Binance Balance</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${balance.amount.toFixed(2)}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          <span className="text-green-500 font-medium">+${balance.earnings.toFixed(2)}</span>
          <span className="ml-1">earnings</span>
        </div>
      </CardContent>
    </Card>
  )
}

