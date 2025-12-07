import { LoginForm } from "../../components/login-form"

export default function SignIn() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-white relative hidden lg:block">
        <img
          src="/resyft.png"
          alt="Resyft"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 merriweather-regular">
            <img 
              src="/resyft-2.png" 
              alt="Resyft Logo" 
              className="w-8 h-8 object-contain"
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}