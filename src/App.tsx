import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/dashboard";
import AgentsPage from "@/pages/agents";
import AgentDetailPage from "@/pages/agent-detail";
import StrategiesPage from "@/pages/strategies";
import ProductsPage from "@/pages/products";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import TheoriesPage from "@/pages/theories";
import CollisionsPage from "@/pages/collisions";
import CollisionEnginePage from "@/pages/collision-engine";
import OraclePage from "@/pages/oracle";
import { ThemeProvider } from "@/hooks/use-theme";

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/agents" component={AgentsPage} />
        <Route path="/agents/:id" component={AgentDetailPage} />
        <Route path="/strategies" component={StrategiesPage} />
        <Route path="/theories" component={TheoriesPage} />
        <Route path="/collisions" component={CollisionsPage} />
        <Route path="/collision-engine" component={CollisionEnginePage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/settings" component={SettingsPage} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
