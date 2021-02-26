import React, { useCallback, useState } from 'react'
import { Box, Button, TextField, Input } from '@material-ui/core'
import { makeStyles, createMuiTheme } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles'
import blue from '@material-ui/core/colors/blue'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import CssBaseline from '@material-ui/core/CssBaseline'
import { InteractionTemplate, InputId } from './model/templates'
import { buildTemplate, GeneratedTx, setProvider } from './utils/encoding'
import { ethers } from 'ethers'
import { SafeAppsSdkProvider } from '@gnosis.pm/safe-apps-ethers-provider';
import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk';
import { checkedTx } from './utils/sapp'
import axios from 'axios'

declare global {
  interface Window { ethereum: any; }
}

const useStyles = makeStyles((theme) => ({
  content: {
    padding: "16px"
  },
  input: {
    width: "100%"
  },
  templateInput: {
    verticalAlign: "center"
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
  const { safe, sdk, connected } = useSafeAppsSDK();
  const [template, setTemplate] = useState<InteractionTemplate | undefined>(undefined)

  const updateTemplate = useCallback(async (newTemplate: InteractionTemplate) => {
    setTemplate(newTemplate)
    setUserInputs({})
    setGeneratedTxs([])
  }, [setTemplate, setGeneratedTxs, setUserInputs])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files!![0]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!e.target?.result) return;
        updateTemplate(JSON.parse(e.target.result.toString()))
      }
      reader.readAsBinaryString(file)
    } catch (e) {
      console.error(e)
    }
  }, [updateTemplate])

  const handleTemplateUrl = useCallback(async (url: string) => {
    if (!url || url.length < 2) return
    try {
      const resp = await axios.get<InteractionTemplate>(url);
      updateTemplate(resp.data)
    } catch (e) {
      console.error(e)
    }
  }, [updateTemplate])

  const build = useCallback(async () => {
    if (!template) return
    try {
      const provider = connected ?
        new SafeAppsSdkProvider(safe, sdk) :
        new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)
      const txs = await buildTemplate(template, userInputs)
      setGeneratedTxs(txs)
    } catch (e) {
      console.error(e)
    }
  }, [connected, safe, sdk, userInputs, template, setGeneratedTxs])

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
        <Box className={classes.templateInput}>
        <Input type="file" inputProps={{ accept: '.json' }} onChange={handleFileUpload} /> &nbsp; or &nbsp; <TextField
            placeholder="Enter template json url"
            onChange={(e) => { handleTemplateUrl(e.target.value) }} />
        </Box>
        {template && (<>
          <h3>Inputs</h3>
          {Object.entries(template.inputs).map(([id, input]) => {
            switch (input.details.type) {
              case "bn":
              case "json":
              case "string":
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
