import { Header, ToasterProvider } from "app/components";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes";
export const App = () => {
  return (
    <ToasterProvider>
      <BrowserRouter>
        <Header />
        <AppRouter />
      </BrowserRouter>
    </ToasterProvider>
  );
};
