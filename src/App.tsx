import React, { useCallback, useState } from 'react'
import { Button, TextField } from '@material-ui/core'
import { makeStyles, createMuiTheme } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles'
import blue from '@material-ui/core/colors/blue'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import CssBaseline from '@material-ui/core/CssBaseline'
import { InteractionTemplate, InputId } from './model/templates'
import { buildTemplate, GeneratedTx } from './utils/encoding'
import { ethers } from 'ethers'
import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk';
import { checkedTx } from './utils/sapp'

declare global {
  interface Window { ethereum: any; }
}

const useStyles = makeStyles((theme) => ({
  content: {
    padding: "16px"
  },
  input: {
    width: "100%"
  }
}));


const updateUserInputs = (inputs: Record<string, string>, id: string, input: string) => {
  const newInputs = { ...inputs }
  newInputs[id] = input
  return newInputs
}

const App = () => {
  const classes = useStyles();
  const [generatedTxs, setGeneratedTxs] = useState<GeneratedTx[]>([])
  const [userInputs, setUserInputs] = useState<Record<InputId, string>>({})
  const { sdk, connected } = useSafeAppsSDK();
  const [template, setTemplate] = useState<InteractionTemplate | undefined>(undefined)

  const handleFileUpload = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files!![0]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!e.target?.result) return;
        const template = JSON.parse(e.target.result.toString())
        setTemplate(template)
        setUserInputs({})
        setGeneratedTxs([])
      }
      reader.readAsBinaryString(file)
    } catch (e) {
      console.error(e)
    }
  }, [setTemplate, setGeneratedTxs, setUserInputs])

  const build = useCallback(async () => {
    if (!template) return
    try {
      const txs = buildTemplate(template, userInputs)
      setGeneratedTxs(txs)
    } catch (e) {
      console.error(e)
    }
  }, [userInputs, template, setGeneratedTxs])

  const execute = useCallback(async (tx: GeneratedTx) => {
    try {
      if (connected) {
        sdk.txs.send({ txs: [checkedTx(tx)] })
        return
      }
      await window.ethereum.enable()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      provider.getSigner().sendTransaction({
        to: tx.to,
        value: tx.value,
        data: tx.data
      })
    } catch (e) {
      console.error(e)
    }
  }, [connected, sdk])

  const executeAll = useCallback(async (txs: GeneratedTx[]) => {
    try {
      sdk.txs.send({ txs: txs.map(checkedTx) })
    } catch (e) {
      console.error(e)
    }
  }, [sdk])

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(() => createMuiTheme({
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
      primary: blue,
    },
  }), [prefersDarkMode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classes.content}>
        <h1>
          Transaction template: {template?.name || "Upload Template"}
        </h1>
        <input type="file" accept=".json" onChange={handleFileUpload} /><br />
        {template && (<>
          <h3>Inputs</h3>
          {Object.entries(template.inputs).map(([id, input]) => {
            switch (input.details.type) {
              case "bn":
              case "json":
                return (
                  <TextField
                    placeholder={input.details.hint}
                    label={input.label}
                    value={userInputs[id] || ""}
                    onChange={(e) => { setUserInputs(updateUserInputs(userInputs, id, e.target.value)) }}
                    className={classes.input} />
                )
            }
          })}
          <Button color="primary" onClick={build}>Build</Button>
          <h3>Transactions {connected && generatedTxs.length > 1 && (<Button color="primary" onClick={() => executeAll(generatedTxs)}>Execute All</Button>)}</h3>
          {generatedTxs.map((tx, index) => (
            <>
              {tx.description || `Transaction #${index + 1}`}
              <Button color="primary" onClick={() => execute(tx)}>Execute</Button>
              <br />
            </>
          ))}
        </>)}
      </div>
    </ThemeProvider>
  );
}

export default App;
