import * as React from "react";
import * as PropTypes from "prop-types";
import Provider from "./Provider";
import { SimpleFunction, IProviderCallback } from "../helpers/types";

import {
  INLINE_SELECTOR_CLASSNAME,
} from "../helpers/constants";

declare global {
  // tslint:disable-next-line
  interface Window {
    ethereum: any;
    web3: any;
    updateWeb3Modal: any;
  }
}

interface IInlineSelectorProps {
  providers: IProviderCallback[];
  onClose: SimpleFunction;
  resetState: SimpleFunction;
}

class InlineSelector extends React.Component<IInlineSelectorProps> {

  constructor(props: IInlineSelectorProps) {
    super(props);
  }

  public static propTypes = {
    providers: PropTypes.object.isRequired,
    resetState: PropTypes.func.isRequired,
  };

  public render = () => {

    const { providers } = this.props;

    return (
      <div className={INLINE_SELECTOR_CLASSNAME}>
        {providers.map(provider =>
          !!provider ? (
            <Provider name={provider.name} onClick={provider.onClick} />
          ) : null
        )}
      </div>
    );
  };
}

export default InlineSelector;
