import { Header, ToasterProvider } from "app/components";
import { HashRouter } from "react-router-dom";
import { AppRouter } from "./routes";
export const App = () => {
  return (
    <ToasterProvider>
      <HashRouter>
        <Header />
        <AppRouter />
      </HashRouter>
    </ToasterProvider>
  );
};
